using LifeEventsHub.Api;
using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Models;
using LifeEventsHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LifeEventsHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly FileStorageService _fileStorage;
    private readonly JwtService _jwt;
    private readonly PricingService _pricing;
    private readonly EventInviteEmailService _inviteEmail;

    // Media rules: main image required (<=5MB image), gallery optional (<=8 images, 5MB each),
    // videos optional (<=3 files, mp4/webm/mov, 100MB each). Files live on disk; DB stores paths only.
    private const int MaxGalleryImages = 8;
    private const int MaxVideos = 3;
    private const long MaxImageBytes = 5L * 1024 * 1024;
    private const long MaxVideoBytes = 100L * 1024 * 1024;
    private static readonly string[] ImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private static readonly string[] VideoExtensions = { ".mp4", ".webm", ".mov" };

    /// <summary>Upper bound for multipart uploads: 1 main + 8 gallery + 3 videos plus headroom.</summary>
    public const long MaxUploadRequestBytes = 400L * 1024 * 1024;

    public EventsController(
        AppDbContext db,
        FileStorageService fileStorage,
        JwtService jwt,
        PricingService pricing,
        EventInviteEmailService inviteEmail)
    {
        _db = db;
        _fileStorage = fileStorage;
        _jwt = jwt;
        _pricing = pricing;
        _inviteEmail = inviteEmail;
    }

    private static bool HasExtension(IFormFile file, string[] allowed)
    {
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        return allowed.Contains(ext);
    }

    /// <summary>Returns an error message when the uploaded media violates limits, otherwise null.</summary>
    private static string? ValidateEventMedia(IFormFile? mainImage, IEnumerable<IFormFile>? gallery, IEnumerable<IFormFile>? videos, bool mainImageRequired)
    {
        if (mainImageRequired && (mainImage == null || mainImage.Length == 0))
            return "Main image is required.";

        if (mainImage != null && mainImage.Length > 0)
        {
            if (!HasExtension(mainImage, ImageExtensions))
                return "Main image must be an image file (jpg, jpeg, png, gif, webp).";
            if (mainImage.Length > MaxImageBytes)
                return "Main image must be 5 MB or smaller.";
        }

        var galleryList = gallery?.Where(f => f.Length > 0).ToList() ?? new List<IFormFile>();
        if (galleryList.Count > MaxGalleryImages)
            return $"Maximum {MaxGalleryImages} gallery images allowed.";
        foreach (var img in galleryList)
        {
            if (!HasExtension(img, ImageExtensions))
                return "Gallery files must be images (jpg, jpeg, png, gif, webp).";
            if (img.Length > MaxImageBytes)
                return "Each gallery image must be 5 MB or smaller.";
        }

        var videoList = videos?.Where(f => f.Length > 0).ToList() ?? new List<IFormFile>();
        if (videoList.Count > MaxVideos)
            return $"Maximum {MaxVideos} videos allowed.";
        foreach (var vid in videoList)
        {
            if (!HasExtension(vid, VideoExtensions))
                return "Videos must be mp4, webm, or mov files.";
            if (vid.Length > MaxVideoBytes)
                return "Each video must be 100 MB or smaller.";
        }

        return null;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<EventListDto>>> GetEvents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? eventType = null,
        [FromQuery] string? search = null,
        [FromQuery] string? fromDate = null,
        [FromQuery] string? toDate = null,
        [FromQuery] string? country = null)
    {
        (page, pageSize) = Paging.Normalize(page, pageSize, defaultPageSize: 10, maxPageSize: Paging.MaxPageSize);

        var now = DateTime.UtcNow;
        var userId = _jwt.GetUserIdFromClaims(User);
        var userEmail = _jwt.GetUserEmailFromClaims(User)?.Trim().ToLowerInvariant();

        // Anonymous traffic: public-only path avoids invite subquery cost.
        IQueryable<Event> query;
        if (!userId.HasValue)
        {
            query = _db.Events.AsNoTracking()
                .Where(e => e.IsPublished
                    && e.PaymentReceived
                    && e.Visibility == "Public"
                    && (e.DisplayValidityEndDate == null || e.DisplayValidityEndDate > now));
        }
        else
        {
            query = _db.Events.AsNoTracking()
                .Where(e => e.IsPublished && e.PaymentReceived &&
                    (e.DisplayValidityEndDate == null || e.DisplayValidityEndDate > now) && (
                    e.Visibility == "Public" ||
                    e.UserId == userId ||
                    (e.Visibility == "InviteOnly" && !string.IsNullOrEmpty(userEmail) &&
                        e.Invites.Any(i => i.InvitedEmail.Trim().ToLower() == userEmail))
                ));
        }

        if (!string.IsNullOrWhiteSpace(country))
        {
            var c = country.Trim().ToLowerInvariant();
            query = query.Where(e => e.Country != null && e.Country.ToLower() == c);
        }

        if (!string.IsNullOrEmpty(eventType))
        {
            var types = eventType == "Obituary"
                ? new[] { "Obituary", "Funeral" }
                : new[] { eventType };
            query = query.Where(e => types.Contains(e.EventType));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(e =>
                e.Title.ToLower().Contains(term) ||
                e.Description.ToLower().Contains(term) ||
                (e.Location != null && e.Location.ToLower().Contains(term)) ||
                (e.Country != null && e.Country.ToLower().Contains(term)));
        }

        if (DateTime.TryParse(fromDate, out var fromDt))
            query = query.Where(e => e.EventDate.Date >= fromDt.Date);
        if (DateTime.TryParse(toDate, out var toDt))
            query = query.Where(e => e.EventDate.Date <= toDt.Date);

        var total = await query.CountAsync();
        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EventListDto(
                e.Id,
                e.Title,
                e.Description.Length > 200 ? e.Description.Substring(0, 200) + "..." : e.Description,
                e.EventType,
                e.EventDate,
                e.BirthDate,
                e.DeathDate,
                e.WeddingDate,
                e.Location,
                e.Country,
                e.MainImageUrl,
                e.CreatedBy,
                e.CreatedAt,
                e.Wishes.Count,
                e.Visibility
            ))
            .ToListAsync();

        items = items.Select(e => e with
        {
            MainImageUrl = FileStorageService.NormalizeUrl(e.MainImageUrl, baseUrl)
        }).ToList();

        return Ok(new PagedResult<EventListDto>(items, total, page, pageSize));
    }

    /// <summary>All events created by the logged-in organizer (including hidden / not yet public).</summary>
    [HttpGet("mine")]
    [Authorize(Roles = "Admin,Customer")]
    public async Task<ActionResult<PagedResult<AdminEventListDto>>> GetMyEvents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? eventType = null,
        [FromQuery] string? search = null,
        [FromQuery] string? fromDate = null,
        [FromQuery] string? toDate = null,
        [FromQuery] string? country = null)
    {
        (page, pageSize) = Paging.Normalize(page, pageSize, defaultPageSize: 12, maxPageSize: Paging.MaxPageSize);

        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var ownerRole = User.IsInRole("Admin") ? "Admin" : "Customer";

        var query = _db.Events.AsNoTracking().Where(e => e.UserId == userId.Value);

        if (!string.IsNullOrWhiteSpace(country))
        {
            var c = country.Trim().ToLowerInvariant();
            query = query.Where(e => e.Country != null && e.Country.Trim().ToLower() == c);
        }

        if (!string.IsNullOrEmpty(eventType))
        {
            var types = eventType == "Obituary"
                ? new[] { "Obituary", "Funeral" }
                : new[] { eventType };
            query = query.Where(e => types.Contains(e.EventType));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(e =>
                e.Title.ToLower().Contains(term) ||
                e.Description.ToLower().Contains(term) ||
                (e.Location != null && e.Location.ToLower().Contains(term)) ||
                (e.Country != null && e.Country.ToLower().Contains(term)));
        }

        if (DateTime.TryParse(fromDate, out var fromDt))
            query = query.Where(e => e.EventDate.Date >= fromDt.Date);
        if (DateTime.TryParse(toDate, out var toDt))
            query = query.Where(e => e.EventDate.Date <= toDt.Date);

        var total = await query.CountAsync();
        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new AdminEventListDto(
                e.Id,
                e.Title,
                e.Description.Length > 200 ? e.Description.Substring(0, 200) + "..." : e.Description,
                e.EventType,
                e.EventDate,
                e.BirthDate,
                e.DeathDate,
                e.WeddingDate,
                e.Location,
                e.Country,
                e.MainImageUrl,
                e.CreatedBy,
                e.CreatedAt,
                e.Wishes.Count,
                e.Visibility,
                e.IsPublished,
                e.DisplayValidityEndDate,
                e.PaymentReceived,
                ownerRole,
                null
            ))
            .ToListAsync();

        items = items.Select(e => e with
        {
            MainImageUrl = FileStorageService.NormalizeUrl(e.MainImageUrl, baseUrl)
        }).ToList();

        return Ok(new PagedResult<AdminEventListDto>(items, total, page, pageSize));
    }

    /// <summary>Recent wishes on the logged-in customer's own events (My Events sidebar).</summary>
    [HttpGet("my-recent-wishes")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<ActionResult<List<RecentWishSidebarDto>>> GetMyRecentWishes([FromQuery] int take = 10)
    {
        take = Math.Clamp(take, 1, 25);
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var wishesData = await _db.Wishes
            .AsNoTracking()
            .Join(
                _db.Events.AsNoTracking(),
                w => w.EventId,
                ev => ev.Id,
                (w, ev) => new { w, ev })
            .Where(x => x.ev.UserId == userId.Value)
            .OrderByDescending(x => x.w.CreatedAt)
            .Take(take)
            .Select(x => new
            {
                x.w.Id,
                x.w.SenderName,
                x.w.Message,
                x.w.CreatedAt,
                x.w.EventId,
                EventTitle = x.ev.Title,
                EventMainImage = x.ev.MainImageUrl
            })
            .ToListAsync();

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        static string Preview(string msg, int max)
        {
            if (string.IsNullOrEmpty(msg)) return "";
            var t = msg.Trim();
            return t.Length <= max ? t : t[..max].TrimEnd() + "…";
        }

        string? Img(string? u) =>
            u != null && u.StartsWith('/') && !u.StartsWith("//", StringComparison.Ordinal)
                ? baseUrl + u
                : u;

        var result = wishesData.Select(w => new RecentWishSidebarDto(
            w.Id,
            w.SenderName,
            Preview(w.Message, 100),
            w.CreatedAt,
            w.EventId,
            w.EventTitle,
            Img(w.EventMainImage)
        )).ToList();

        return Ok(result);
    }

    /// <summary>Admin portal: counts of events by creator role.</summary>
    [HttpGet("manage/stats")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EventManageStatsDto>> GetManageEventStats()
    {
        var rows = await _db.Events.AsNoTracking()
            .GroupJoin(
                _db.Users.AsNoTracking(),
                e => e.UserId,
                u => u.Id,
                (e, users) => new { e, u = users.FirstOrDefault() })
            .Select(x => x.u != null && x.u.Role == "Admin" ? "Admin" : "Customer")
            .GroupBy(role => role)
            .Select(g => new { Role = g.Key, Count = g.Count() })
            .ToListAsync();

        var adminCount = rows.FirstOrDefault(x => x.Role == "Admin")?.Count ?? 0;
        var customerCount = rows.FirstOrDefault(x => x.Role == "Customer")?.Count ?? 0;
        return Ok(new EventManageStatsDto(adminCount, customerCount));
    }

    /// <summary>Admin portal: all platform events, optionally filtered by creator role.</summary>
    [HttpGet("manage")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<AdminEventListDto>>> GetManageEvents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? eventType = null,
        [FromQuery] string? search = null,
        [FromQuery] string? source = null)
    {
        (page, pageSize) = Paging.Normalize(page, pageSize, defaultPageSize: 12, maxPageSize: Paging.MaxPageSize);

        var query = _db.Events.AsNoTracking()
            .GroupJoin(
                _db.Users.AsNoTracking(),
                e => e.UserId,
                u => u.Id,
                (e, users) => new { Event = e, User = users.FirstOrDefault() });

        if (string.Equals(source, "admin", StringComparison.OrdinalIgnoreCase))
            query = query.Where(x => x.User == null || x.User.Role == "Admin");
        else if (string.Equals(source, "customer", StringComparison.OrdinalIgnoreCase))
            query = query.Where(x => x.User != null && x.User.Role == "Customer");

        if (!string.IsNullOrEmpty(eventType))
        {
            var types = eventType == "Obituary"
                ? new[] { "Obituary", "Funeral" }
                : new[] { eventType };
            query = query.Where(x => types.Contains(x.Event.EventType));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x =>
                x.Event.Title.ToLower().Contains(term) ||
                x.Event.Description.ToLower().Contains(term) ||
                (x.Event.Location != null && x.Event.Location.ToLower().Contains(term)) ||
                (x.Event.Country != null && x.Event.Country.ToLower().Contains(term)) ||
                (x.User != null && x.User.DisplayName.ToLower().Contains(term)));
        }

        var total = await query.CountAsync();
        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var items = await query
            .OrderByDescending(x => x.Event.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AdminEventListDto(
                x.Event.Id,
                x.Event.Title,
                x.Event.Description.Length > 200 ? x.Event.Description.Substring(0, 200) + "..." : x.Event.Description,
                x.Event.EventType,
                x.Event.EventDate,
                x.Event.BirthDate,
                x.Event.DeathDate,
                x.Event.WeddingDate,
                x.Event.Location,
                x.Event.Country,
                x.Event.MainImageUrl,
                x.Event.CreatedBy,
                x.Event.CreatedAt,
                x.Event.Wishes.Count,
                x.Event.Visibility,
                x.Event.IsPublished,
                x.Event.DisplayValidityEndDate,
                x.Event.PaymentReceived,
                x.User != null && x.User.Role == "Admin" ? "Admin" : "Customer",
                x.User != null ? x.User.DisplayName : null
            ))
            .ToListAsync();

        items = items.Select(e => e with
        {
            MainImageUrl = FileStorageService.NormalizeUrl(e.MainImageUrl, baseUrl)
        }).ToList();

        return Ok(new PagedResult<AdminEventListDto>(items, total, page, pageSize));
    }

    /// <summary>Pending payment drafts for the logged-in customer (not yet published).</summary>
    [HttpGet("my-drafts")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<ActionResult<IReadOnlyList<CustomerDraftListDto>>> GetMyDrafts()
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var drafts = await _db.PendingEvents.AsNoTracking()
            .Where(d => d.UserId == userId.Value)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        var items = drafts.Select(d =>
        {
            var main = d.MainImagePath;
            if (!string.IsNullOrEmpty(main) && main.StartsWith('/') && !main.StartsWith("//", StringComparison.Ordinal))
                main = baseUrl + main;
            return new CustomerDraftListDto(
                d.Id,
                d.Title,
                d.EventType,
                d.EventDate,
                d.DisplayDays,
                d.AmountPaid,
                d.AwaitingOfflineApproval,
                d.PaymentMethod,
                d.CreatedAt,
                main,
                d.OfflineSubmittedAt
            );
        }).ToList();

        return Ok(items);
    }

    /// <summary>Load event for editing (owner admin) even if unpublished or expired on the public feed.</summary>
    [HttpGet("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EventDetailDto>> GetEventForAdmin(int id)
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var ev = await _db.Events
            .AsNoTracking()
            .Include(e => e.Wishes)
            .Include(e => e.Invites)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (ev == null) return NotFound();

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var mainImage = FileStorageService.NormalizeUrl(ev.MainImageUrl, baseUrl);

        var invitedEmailsList = ev.Visibility == "InviteOnly"
            ? ev.Invites.Select(i => i.InvitedEmail).ToList()
            : new List<string>();

        return Ok(new EventDetailDto(
            ev.Id,
            ev.Title,
            ev.Description,
            ev.EventType,
            ev.EventDate,
            ev.BirthDate,
            ev.DeathDate,
            ev.WeddingDate,
            ev.Location,
            ev.Country,
            mainImage,
            FileStorageService.NormalizeJsonArrayUrls(ev.GalleryUrls, baseUrl),
            FileStorageService.NormalizeJsonArrayUrls(ev.VideoUrls, baseUrl),
            ev.CreatedBy,
            ev.CreatedAt,
            ev.Wishes.OrderByDescending(w => w.CreatedAt).Select(w => new WishDto(w.Id, w.SenderName, w.Message, w.MediaUrl, w.CreatedAt)).ToList(),
            ev.Visibility,
            ev.PaymentReceived,
            true,
            invitedEmailsList
        ));
    }

    [HttpPatch("{id:int}/published")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SetPublished(int id, [FromBody] SetPublishedDto dto, CancellationToken cancellationToken)
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var ev = await _db.Events
            .Include(e => e.Invites)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (ev == null) return NotFound();

        var wasPublished = ev.IsPublished;
        ev.IsPublished = dto.Published;
        await _db.SaveChangesAsync(cancellationToken);

        if (!wasPublished && ev.IsPublished && ev.Visibility == "InviteOnly" && ev.Invites.Count > 0)
        {
            await _inviteEmail.SendInvitesAsync(
                ev.Id,
                ev.Title,
                ev.CreatedBy,
                ev.Invites.Select(i => i.InvitedEmail),
                cancellationToken);
        }

        return NoContent();
    }

    [HttpGet("admin/payment-pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IReadOnlyList<AdminPaymentEventDto>>> GetAdminPaymentPending(
        CancellationToken cancellationToken)
    {
        var events = await _db.Events
            .AsNoTracking()
            .Where(e => !e.PaymentReceived && (e.User == null || e.User.Role == "Admin"))
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.EventType,
                e.EventDate,
                e.DisplayDays,
                e.CreatedAt,
                e.MainImageUrl
            })
            .ToListAsync(cancellationToken);

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var result = events.Select(e =>
        {
            var option = _pricing.GetOption(e.DisplayDays ?? 30);
            return new AdminPaymentEventDto(
                e.Id,
                e.Title,
                e.EventType,
                e.EventDate,
                e.DisplayDays ?? 30,
                option?.Price ?? 0,
                e.CreatedAt,
                FileStorageService.NormalizeUrl(e.MainImageUrl, baseUrl));
        }).ToList();

        return Ok(result);
    }

    [HttpPatch("{id:int}/payment-received")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> MarkPaymentReceived(
        int id,
        CancellationToken cancellationToken)
    {
        var ev = await _db.Events
            .Include(e => e.User)
            .Include(e => e.Invites)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (ev == null)
            return NotFound();
        if (ev.User != null && ev.User.Role != "Admin")
            return BadRequest(new { message = "Customer offline payments must be approved from their review page." });

        var option = _pricing.GetOption(ev.DisplayDays ?? 30);
        if (option == null)
            return BadRequest(new { message = "The event has an invalid display plan." });

        var wasPublished = ev.IsPublished;
        ev.PaymentReceived = true;
        ev.AmountPaid = option.Price;
        ev.IsPublished = true;
        ev.DisplayValidityEndDate = DateTime.UtcNow.AddDays(option.Days);
        await _db.SaveChangesAsync(cancellationToken);

        if (!wasPublished && ev.Visibility == "InviteOnly" && ev.Invites.Count > 0)
        {
            await _inviteEmail.SendInvitesAsync(
                ev.Id,
                ev.Title,
                ev.CreatedBy,
                ev.Invites.Select(i => i.InvitedEmail),
                cancellationToken);
        }

        return NoContent();
    }

    [HttpGet("stats/count-by-country")]
    [Microsoft.AspNetCore.OutputCaching.OutputCache(PolicyName = "CountryStats")]
    public async Task<ActionResult<List<CountryCountDto>>> GetCountryStats()
    {
        var now = DateTime.UtcNow;
        var stats = await _db.Events
            .AsNoTracking()
            .Where(e => e.IsPublished
                && e.PaymentReceived
                && (e.DisplayValidityEndDate == null || e.DisplayValidityEndDate > now)
                && e.Visibility == "Public"
                && e.Country != null && e.Country != "")
            .GroupBy(e => e.Country!)
            .Select(g => new CountryCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return Ok(stats);
    }

    /// <summary>Recent wishes on public events (for customer feed sidebars).</summary>
    [HttpGet("recent-wishes")]
    public async Task<ActionResult<List<RecentWishSidebarDto>>> GetRecentWishes([FromQuery] int take = 10)
    {
        take = Math.Clamp(take, 1, 25);
        var now = DateTime.UtcNow;
        var wishesData = await _db.Wishes
            .AsNoTracking()
            .Join(
                _db.Events.AsNoTracking(),
                w => w.EventId,
                ev => ev.Id,
                (w, ev) => new { w, ev })
            .Where(x => x.ev.IsPublished
                && x.ev.PaymentReceived
                && (x.ev.DisplayValidityEndDate == null || x.ev.DisplayValidityEndDate > now)
                && x.ev.Visibility == "Public")
            .OrderByDescending(x => x.w.CreatedAt)
            .Take(take)
            .Select(x => new
            {
                x.w.Id,
                x.w.SenderName,
                x.w.Message,
                x.w.CreatedAt,
                x.w.EventId,
                EventTitle = x.ev.Title,
                EventMainImage = x.ev.MainImageUrl
            })
            .ToListAsync();

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        static string Preview(string msg, int max)
        {
            if (string.IsNullOrEmpty(msg)) return "";
            var t = msg.Trim();
            return t.Length <= max ? t : t[..max].TrimEnd() + "…";
        }

        string? Img(string? u) =>
            u != null && u.StartsWith('/') && !u.StartsWith("//", StringComparison.Ordinal)
                ? baseUrl + u
                : u;

        var result = wishesData.Select(w => new RecentWishSidebarDto(
            w.Id,
            w.SenderName,
            Preview(w.Message, 100),
            w.CreatedAt,
            w.EventId,
            w.EventTitle,
            Img(w.EventMainImage)
        )).ToList();

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EventDetailDto>> GetEvent(int id)
    {
        var now = DateTime.UtcNow;
        var ev = await _db.Events
            .AsNoTracking()
            .Include(e => e.Wishes)
            .Include(e => e.Invites)
            .FirstOrDefaultAsync(e => e.Id == id && e.IsPublished && e.PaymentReceived &&
                (e.DisplayValidityEndDate == null || e.DisplayValidityEndDate > now));

        if (ev == null)
            return NotFound();

        var userId = _jwt.GetUserIdFromClaims(User);
        var userEmail = _jwt.GetUserEmailFromClaims(User)?.Trim().ToLowerInvariant();
        var isOwner = ev.UserId.HasValue && ev.UserId == userId;

        var canView = ev.Visibility == "Public" ||
            (isOwner) ||
            (ev.Visibility == "InviteOnly" && userId.HasValue && !string.IsNullOrEmpty(userEmail) &&
                ev.Invites.Any(i => i.InvitedEmail.Trim().ToLower() == userEmail)) ||
            (ev.Visibility == "Private" && isOwner);

        if (!canView)
            return NotFound();

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var mainImage = FileStorageService.NormalizeUrl(ev.MainImageUrl, baseUrl);

        return Ok(new EventDetailDto(
            ev.Id,
            ev.Title,
            ev.Description,
            ev.EventType,
            ev.EventDate,
            ev.BirthDate,
            ev.DeathDate,
            ev.WeddingDate,
            ev.Location,
            ev.Country,
            mainImage,
            FileStorageService.NormalizeJsonArrayUrls(ev.GalleryUrls, baseUrl),
            FileStorageService.NormalizeJsonArrayUrls(ev.VideoUrls, baseUrl),
            ev.CreatedBy,
            ev.CreatedAt,
            ev.Wishes.OrderByDescending(w => w.CreatedAt).Select(w => new WishDto(w.Id, w.SenderName, w.Message, w.MediaUrl, w.CreatedAt)).ToList(),
            ev.Visibility,
            ev.PaymentReceived,
            isOwner,
            isOwner ? ev.Invites.Select(i => i.InvitedEmail).ToList() : new List<string>()
        ));
    }

    /// <summary>Save event as draft before payment. Returns draftId for payment flow.</summary>
    [HttpPost("save-draft")]
    [Authorize(Roles = "Admin,Customer")]
    [RequestSizeLimit(MaxUploadRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxUploadRequestBytes)]
    public async Task<ActionResult<SaveDraftResultDto>> SaveDraft([FromForm] CreateEventFormDto dto)
    {
        var option = _pricing.GetOption(dto.DisplayDays);
        if (option == null)
            return BadRequest(new { message = "Invalid display duration. Choose 1 month (30 days), 3 months (90 days), 6 months (180 days), or 12 months (365 days)." });

        var mediaError = ValidateEventMedia(dto.MainImage, dto.GalleryImages, dto.Videos, mainImageRequired: true);
        if (mediaError != null)
            return BadRequest(new { message = mediaError });

        var userId = _jwt.GetUserIdFromClaims(User);
        var user = userId.HasValue ? await _db.Users.FindAsync(userId.Value) : null;
        var createdBy = user?.DisplayName ?? dto.CreatedBy ?? "Anonymous";
        var folderUserId = userId ?? 0;

        var draft = new PendingEvent
        {
            Title = dto.Title,
            Description = dto.Description,
            EventType = dto.EventType,
            EventDate = dto.EventDate,
            BirthDate = dto.BirthDate,
            DeathDate = dto.DeathDate,
            WeddingDate = dto.WeddingDate,
            Location = dto.Location,
            Country = dto.Country,
            MainImagePath = null,
            GalleryPathsJson = null,
            CreatedBy = createdBy,
            UserId = userId,
            Visibility = dto.Visibility ?? "Public",
            InvitedEmails = dto.InvitedEmails,
            DisplayDays = dto.DisplayDays,
            AmountPaid = option.Price,
            PaymentReceived = dto.PaymentReceived
        };

        _db.PendingEvents.Add(draft);
        await _db.SaveChangesAsync();

        var mainImagePath = await _fileStorage.SaveFileAsync(dto.MainImage!, folderUserId, draft.Id);
        if (mainImagePath == null)
        {
            _db.PendingEvents.Remove(draft);
            await _db.SaveChangesAsync();
            return BadRequest(new { message = "Main image could not be saved. Use jpg, jpeg, png, gif, or webp up to 5 MB." });
        }

        var galleryPaths = new List<string>();
        if (dto.GalleryImages != null)
        {
            foreach (var img in dto.GalleryImages.Take(MaxGalleryImages))
            {
                var url = await _fileStorage.SaveFileAsync(img, folderUserId, draft.Id);
                if (url != null)
                    galleryPaths.Add(url);
            }
        }

        var videoPaths = new List<string>();
        if (dto.Videos != null)
        {
            foreach (var vid in dto.Videos.Take(MaxVideos))
            {
                var url = await _fileStorage.SaveVideoFileAsync(vid, draft.Id);
                if (url != null)
                    videoPaths.Add(url);
            }
        }

        var draftRow = await _db.PendingEvents.FindAsync(draft.Id);
        if (draftRow != null)
        {
            draftRow.MainImagePath = mainImagePath;
            draftRow.GalleryPathsJson = galleryPaths.Count > 0 ? System.Text.Json.JsonSerializer.Serialize(galleryPaths) : null;
            draftRow.VideoPathsJson = videoPaths.Count > 0 ? System.Text.Json.JsonSerializer.Serialize(videoPaths) : null;
            await _db.SaveChangesAsync();
        }

        return Ok(new SaveDraftResultDto(draft.Id, option.Days, option.Price, option.Label));
    }

    /// <summary>Direct create for admin portal (no payment flow).</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(MaxUploadRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxUploadRequestBytes)]
    public async Task<ActionResult<EventDetailDto>> CreateEvent([FromForm] CreateEventFormDto dto, CancellationToken cancellationToken)
    {
        var option = _pricing.GetOption(dto.DisplayDays);
        if (option == null)
            return BadRequest(new { message = "Invalid display duration. Choose 1 month (30 days), 3 months (90 days), 6 months (180 days), or 12 months (365 days)." });

        var mediaError = ValidateEventMedia(dto.MainImage, dto.GalleryImages, dto.Videos, mainImageRequired: true);
        if (mediaError != null)
            return BadRequest(new { message = mediaError });

        var userId = _jwt.GetUserIdFromClaims(User);
        var user = userId.HasValue ? await _db.Users.FindAsync(new object[] { userId.Value }, cancellationToken) : null;
        var createdBy = user?.DisplayName ?? dto.CreatedBy ?? "Anonymous";
        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var validityEnd = DateTime.UtcNow.AddDays(dto.DisplayDays);

        var ev = new Event
        {
            Title = dto.Title,
            Description = dto.Description,
            EventType = dto.EventType,
            EventDate = dto.EventDate,
            BirthDate = dto.BirthDate,
            DeathDate = dto.DeathDate,
            WeddingDate = dto.WeddingDate,
            Location = dto.Location,
            Country = dto.Country,
            MainImageUrl = null,
            GalleryUrls = null,
            CreatedBy = createdBy,
            UserId = userId,
            IsPublished = dto.PaymentReceived,
            Visibility = dto.Visibility ?? "Public",
            DisplayDays = dto.DisplayDays,
            DisplayValidityEndDate = validityEnd,
            CurrencyCode = string.IsNullOrWhiteSpace(dto.Currency) ? "USD" : dto.Currency.Trim().ToUpperInvariant(),
            AmountGBP = 0,
            AmountPaid = dto.PaymentReceived ? option.Price : 0,
            ExchangeRateUsed = 1,
            PaymentReceived = dto.PaymentReceived
        };

        _db.Events.Add(ev);
        await _db.SaveChangesAsync(cancellationToken);

        // DB stores relative paths only; responses normalize with the base URL.
        var mainPath = await _fileStorage.SaveFileAsync(dto.MainImage!, userId ?? 0, ev.Id);
        if (mainPath == null)
        {
            _db.Events.Remove(ev);
            await _db.SaveChangesAsync(cancellationToken);
            return BadRequest(new { message = "Main image could not be saved. Use jpg, jpeg, png, gif, or webp up to 5 MB." });
        }
        ev.MainImageUrl = mainPath;

        if (dto.GalleryImages != null)
        {
            var list = new List<string>();
            foreach (var img in dto.GalleryImages.Take(MaxGalleryImages))
            {
                var url = await _fileStorage.SaveFileAsync(img, userId ?? 0, ev.Id);
                if (url != null)
                    list.Add(url);
            }
            if (list.Count > 0)
                ev.GalleryUrls = System.Text.Json.JsonSerializer.Serialize(list);
        }

        if (dto.Videos != null)
        {
            var list = new List<string>();
            foreach (var vid in dto.Videos.Take(MaxVideos))
            {
                var url = await _fileStorage.SaveVideoFileAsync(vid, ev.Id);
                if (url != null)
                    list.Add(url);
            }
            if (list.Count > 0)
                ev.VideoUrls = System.Text.Json.JsonSerializer.Serialize(list);
        }

        await _db.SaveChangesAsync(cancellationToken);

        if (ev.Visibility == "InviteOnly" && !string.IsNullOrWhiteSpace(dto.InvitedEmails))
        {
            var emails = dto.InvitedEmails.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();
            foreach (var email in emails)
            {
                if (string.IsNullOrEmpty(email)) continue;
                _db.EventInvites.Add(new EventInvite { EventId = ev.Id, InvitedEmail = email });
            }
            await _db.SaveChangesAsync(cancellationToken);

            if (ev.IsPublished && emails.Count > 0)
            {
                await _inviteEmail.SendInvitesAsync(
                    ev.Id, ev.Title, ev.CreatedBy, emails, cancellationToken);
            }
        }

        var invitedEmailsList = ev.Visibility == "InviteOnly"
            ? await _db.EventInvites.Where(i => i.EventId == ev.Id).Select(i => i.InvitedEmail).ToListAsync(cancellationToken)
            : new List<string>();

        return Ok(new EventDetailDto(
            ev.Id,
            ev.Title,
            ev.Description,
            ev.EventType,
            ev.EventDate,
            ev.BirthDate,
            ev.DeathDate,
            ev.WeddingDate,
            ev.Location,
            ev.Country,
            FileStorageService.NormalizeUrl(ev.MainImageUrl, baseUrl),
            FileStorageService.NormalizeJsonArrayUrls(ev.GalleryUrls, baseUrl),
            FileStorageService.NormalizeJsonArrayUrls(ev.VideoUrls, baseUrl),
            ev.CreatedBy,
            ev.CreatedAt,
            new List<WishDto>(),
            ev.Visibility,
            ev.PaymentReceived,
            true,
            invitedEmailsList
        ));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(MaxUploadRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxUploadRequestBytes)]
    public async Task<ActionResult<EventDetailDto>> UpdateEvent(int id, [FromForm] UpdateEventFormDto dto)
    {
        var ev = await _db.Events.FindAsync(id);
        if (ev == null)
            return NotFound();

        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var mediaError = ValidateEventMedia(dto.MainImage, dto.GalleryImages, dto.Videos, mainImageRequired: false);
        if (mediaError != null)
            return BadRequest(new { message = mediaError });

        var storageUserId = ev.UserId ?? userId.Value;
        var baseUrl = _fileStorage.GetBaseUrl(Request);
        string? mainImageUrl = ev.MainImageUrl;
        if (dto.MainImage != null)
        {
            var url = await _fileStorage.SaveFileAsync(dto.MainImage, storageUserId, id);
            if (url != null)
                mainImageUrl = url;
        }

        var galleryUrls = ev.GalleryUrls;
        if (dto.GalleryImages != null && dto.GalleryImages.Any())
        {
            var list = new List<string>();
            foreach (var img in dto.GalleryImages.Take(MaxGalleryImages))
            {
                var url = await _fileStorage.SaveFileAsync(img, storageUserId, id);
                if (url != null)
                    list.Add(url);
            }
            if (list.Count > 0)
                galleryUrls = System.Text.Json.JsonSerializer.Serialize(list);
        }

        var videoUrls = ev.VideoUrls;
        if (dto.Videos != null && dto.Videos.Any())
        {
            var list = new List<string>();
            foreach (var vid in dto.Videos.Take(MaxVideos))
            {
                var url = await _fileStorage.SaveVideoFileAsync(vid, id);
                if (url != null)
                    list.Add(url);
            }
            if (list.Count > 0)
                videoUrls = System.Text.Json.JsonSerializer.Serialize(list);
        }

        ev.Title = dto.Title ?? ev.Title;
        ev.Description = dto.Description ?? ev.Description;
        ev.EventType = dto.EventType ?? ev.EventType;
        if (dto.EventDate.HasValue) ev.EventDate = dto.EventDate.Value;
        ev.BirthDate = dto.BirthDate ?? ev.BirthDate;
        ev.DeathDate = dto.DeathDate ?? ev.DeathDate;
        ev.WeddingDate = dto.WeddingDate ?? ev.WeddingDate;
        ev.Location = dto.Location ?? ev.Location;
        ev.Country = dto.Country ?? ev.Country;
        ev.MainImageUrl = mainImageUrl;
        ev.GalleryUrls = galleryUrls;
        ev.VideoUrls = videoUrls;
        ev.Visibility = dto.Visibility ?? ev.Visibility;
        if (dto.PaymentReceived.HasValue)
            ev.PaymentReceived = dto.PaymentReceived.Value;

        if (dto.IsPublished.HasValue)
            ev.IsPublished = dto.IsPublished.Value;

        if (ev.Visibility == "InviteOnly" && dto.InvitedEmails != null)
        {
            var existingInvites = await _db.EventInvites.Where(i => i.EventId == id).ToListAsync();
            var previousEmails = existingInvites
                .Select(i => i.InvitedEmail.Trim().ToLowerInvariant())
                .ToHashSet();
            _db.EventInvites.RemoveRange(existingInvites);

            var emails = dto.InvitedEmails.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();
            foreach (var email in emails)
            {
                if (string.IsNullOrEmpty(email)) continue;
                _db.EventInvites.Add(new EventInvite { EventId = id, InvitedEmail = email });
            }

            await _db.SaveChangesAsync();

            if (ev.IsPublished)
            {
                var newlyInvited = emails.Where(e => !previousEmails.Contains(e)).ToList();
                if (newlyInvited.Count > 0)
                {
                    await _inviteEmail.SendInvitesAsync(ev.Id, ev.Title, ev.CreatedBy, newlyInvited);
                }
            }
        }
        else
        {
            await _db.SaveChangesAsync();
        }

        var invitedEmailsList = ev.Visibility == "InviteOnly"
            ? await _db.EventInvites.Where(i => i.EventId == id).Select(i => i.InvitedEmail).ToListAsync()
            : new List<string>();

        var mainImg = FileStorageService.NormalizeUrl(ev.MainImageUrl, baseUrl);
        var wishes = await _db.Wishes.Where(w => w.EventId == id).OrderByDescending(w => w.CreatedAt)
            .Select(w => new WishDto(w.Id, w.SenderName, w.Message, w.MediaUrl, w.CreatedAt)).ToListAsync();

        return Ok(new EventDetailDto(
            ev.Id,
            ev.Title,
            ev.Description,
            ev.EventType,
            ev.EventDate,
            ev.BirthDate,
            ev.DeathDate,
            ev.WeddingDate,
            ev.Location,
            ev.Country,
            mainImg,
            FileStorageService.NormalizeJsonArrayUrls(ev.GalleryUrls, baseUrl),
            FileStorageService.NormalizeJsonArrayUrls(ev.VideoUrls, baseUrl),
            ev.CreatedBy,
            ev.CreatedAt,
            wishes,
            ev.Visibility,
            ev.PaymentReceived,
            true,
            invitedEmailsList
        ));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        var ev = await _db.Events.FindAsync(id);
        if (ev == null)
            return NotFound();

        _db.Events.Remove(ev);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class CreateEventFormDto
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string EventType { get; set; } = "";
    public DateTime EventDate { get; set; }
    public int DisplayDays { get; set; } = 30; // 30, 90, 180, or 365 — required for save-draft
    public string? Location { get; set; }
    public string? Country { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? DeathDate { get; set; }
    public DateTime? WeddingDate { get; set; }
    public string? CreatedBy { get; set; }
    public string? Visibility { get; set; } = "Public";
    public string? InvitedEmails { get; set; } // Comma-separated emails for InviteOnly
    public string? Currency { get; set; }
    public bool PaymentReceived { get; set; }
    public IFormFile? MainImage { get; set; }
    public IEnumerable<IFormFile>? GalleryImages { get; set; }
    public IEnumerable<IFormFile>? Videos { get; set; }
}

public class UpdateEventFormDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? EventType { get; set; }
    public DateTime? EventDate { get; set; }
    public string? Location { get; set; }
    public string? Country { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? DeathDate { get; set; }
    public DateTime? WeddingDate { get; set; }
    public string? Visibility { get; set; }
    public string? InvitedEmails { get; set; } // Comma-separated for InviteOnly
    public bool? IsPublished { get; set; }
    public bool? PaymentReceived { get; set; }
    public IFormFile? MainImage { get; set; }
    public IEnumerable<IFormFile>? GalleryImages { get; set; }
    public IEnumerable<IFormFile>? Videos { get; set; }
}

public record CountryCountDto(string Country, int Count);

public record SaveDraftResultDto(int DraftId, int DisplayDays, decimal Price, string Label);

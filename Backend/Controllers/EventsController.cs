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

    public EventsController(AppDbContext db, FileStorageService fileStorage, JwtService jwt, PricingService pricing)
    {
        _db = db;
        _fileStorage = fileStorage;
        _jwt = jwt;
        _pricing = pricing;
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

        var userId = _jwt.GetUserIdFromClaims(User);
        var userEmail = _jwt.GetUserEmailFromClaims(User)?.Trim().ToLowerInvariant();

        var now = DateTime.UtcNow;
        var query = _db.Events.AsNoTracking()
            .Where(e => e.IsPublished && (e.DisplayValidityEndDate == null || e.DisplayValidityEndDate > now) && (
                e.Visibility == "Public" ||
                (userId.HasValue && e.UserId == userId) ||
                (e.Visibility == "InviteOnly" && userId.HasValue && !string.IsNullOrEmpty(userEmail) &&
                    e.Invites.Any(i => i.InvitedEmail.Trim().ToLower() == userEmail))
            ));

        if (!string.IsNullOrWhiteSpace(country))
        {
            var c = country.Trim().ToLowerInvariant();
            query = query.Where(e => e.Country != null && e.Country.Trim().ToLower() == c);
        }

        if (!string.IsNullOrEmpty(eventType))
        {
            // Legacy: Funeral grouped with Obituary; "Wedding" is its own filter (not merged with Anniversary).
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

        return Ok(new PagedResult<EventListDto>(items, total, page, pageSize));
    }

    /// <summary>All events created by the logged-in organizer (including hidden / not yet public).</summary>
    [HttpGet("mine")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<AdminEventListDto>>> GetMyEvents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? eventType = null,
        [FromQuery] string? search = null)
    {
        (page, pageSize) = Paging.Normalize(page, pageSize, defaultPageSize: 12, maxPageSize: Paging.MaxPageSize);

        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var query = _db.Events.AsNoTracking().Where(e => e.UserId == userId.Value);

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

        var total = await query.CountAsync();
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
                e.PaymentReceived
            ))
            .ToListAsync();

        return Ok(new PagedResult<AdminEventListDto>(items, total, page, pageSize));
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
        if (!ev.UserId.HasValue || ev.UserId != userId) return Forbid();

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var mainImage = ev.MainImageUrl != null && ev.MainImageUrl.StartsWith('/') && !ev.MainImageUrl.StartsWith("//", StringComparison.Ordinal)
            ? baseUrl + ev.MainImageUrl
            : ev.MainImageUrl;

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
            ev.GalleryUrls,
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
    public async Task<IActionResult> SetPublished(int id, [FromBody] SetPublishedDto dto)
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var ev = await _db.Events.FindAsync(id);
        if (ev == null) return NotFound();
        if (!ev.UserId.HasValue || ev.UserId != userId) return Forbid();

        ev.IsPublished = dto.Published;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats/count-by-country")]
    public async Task<ActionResult<List<CountryCountDto>>> GetCountryStats()
    {
        var now = DateTime.UtcNow;
        var stats = await _db.Events
            .AsNoTracking()
            .Where(e => e.IsPublished && (e.DisplayValidityEndDate == null || e.DisplayValidityEndDate > now) && e.Visibility == "Public" && e.Country != null && e.Country != "")
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
            .FirstOrDefaultAsync(e => e.Id == id && e.IsPublished && (e.DisplayValidityEndDate == null || e.DisplayValidityEndDate > now));

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
        var mainImage = ev.MainImageUrl != null && ev.MainImageUrl.StartsWith('/') && !ev.MainImageUrl.StartsWith("//", StringComparison.Ordinal)
            ? baseUrl + ev.MainImageUrl
            : ev.MainImageUrl;

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
            ev.GalleryUrls,
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
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SaveDraftResultDto>> SaveDraft([FromForm] CreateEventFormDto dto)
    {
        var option = _pricing.GetOption(dto.DisplayDays);
        if (option == null)
            return BadRequest(new { message = "Invalid display duration. Choose 1, 3, 7, 14, 30, or 90 days." });

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

        string? mainImagePath = null;
        if (dto.MainImage != null)
        {
            mainImagePath = await _fileStorage.SaveFileAsync(dto.MainImage, folderUserId, draft.Id);
        }

        var galleryPaths = new List<string>();
        if (dto.GalleryImages != null)
        {
            foreach (var img in dto.GalleryImages)
            {
                var url = await _fileStorage.SaveFileAsync(img, folderUserId, draft.Id);
                if (url != null)
                    galleryPaths.Add(url);
            }
        }

        var draftRow = await _db.PendingEvents.FindAsync(draft.Id);
        if (draftRow != null)
        {
            draftRow.MainImagePath = mainImagePath;
            draftRow.GalleryPathsJson = galleryPaths.Count > 0 ? System.Text.Json.JsonSerializer.Serialize(galleryPaths) : null;
            await _db.SaveChangesAsync();
        }

        return Ok(new SaveDraftResultDto(draft.Id, option.Days, option.Price, option.Label));
    }

    /// <summary>Direct create for admin portal (no payment flow).</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EventDetailDto>> CreateEvent([FromForm] CreateEventFormDto dto, CancellationToken cancellationToken)
    {
        var option = _pricing.GetOption(dto.DisplayDays);
        if (option == null)
            return BadRequest(new { message = "Invalid display duration. Choose 1, 3, 7, 14, 30, or 90 days." });

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
            IsPublished = true,
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

        if (dto.MainImage != null)
        {
            var url = await _fileStorage.SaveFileAsync(dto.MainImage, userId ?? 0, ev.Id);
            if (url != null)
                ev.MainImageUrl = baseUrl + url;
        }

        if (dto.GalleryImages != null)
        {
            var list = new List<string>();
            foreach (var img in dto.GalleryImages)
            {
                var url = await _fileStorage.SaveFileAsync(img, userId ?? 0, ev.Id);
                if (url != null)
                    list.Add(baseUrl + url);
            }
            if (list.Count > 0)
                ev.GalleryUrls = System.Text.Json.JsonSerializer.Serialize(list);
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
            ev.MainImageUrl,
            ev.GalleryUrls,
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
    public async Task<ActionResult<EventDetailDto>> UpdateEvent(int id, [FromForm] UpdateEventFormDto dto)
    {
        var ev = await _db.Events.FindAsync(id);
        if (ev == null)
            return NotFound();

        var userId = _jwt.GetUserIdFromClaims(User);
        if (!ev.UserId.HasValue || ev.UserId != userId)
            return Forbid();

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        string? mainImageUrl = ev.MainImageUrl;
        if (dto.MainImage != null)
        {
            var url = await _fileStorage.SaveFileAsync(dto.MainImage, userId.Value, id);
            if (url != null)
                mainImageUrl = baseUrl + url;
        }

        var galleryUrls = ev.GalleryUrls;
        if (dto.GalleryImages != null && dto.GalleryImages.Any())
        {
            var list = new List<string>();
            foreach (var img in dto.GalleryImages)
            {
                var url = await _fileStorage.SaveFileAsync(img, userId.Value, id);
                if (url != null)
                    list.Add(baseUrl + url);
            }
            if (list.Count > 0)
                galleryUrls = System.Text.Json.JsonSerializer.Serialize(list);
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
        ev.Visibility = dto.Visibility ?? ev.Visibility;
        if (dto.PaymentReceived.HasValue)
            ev.PaymentReceived = dto.PaymentReceived.Value;

        if (dto.IsPublished.HasValue)
            ev.IsPublished = dto.IsPublished.Value;

        if (ev.Visibility == "InviteOnly" && dto.InvitedEmails != null)
        {
            var existingInvites = await _db.EventInvites.Where(i => i.EventId == id).ToListAsync();
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
        }

        await _db.SaveChangesAsync();

        var invitedEmailsList = ev.Visibility == "InviteOnly"
            ? await _db.EventInvites.Where(i => i.EventId == id).Select(i => i.InvitedEmail).ToListAsync()
            : new List<string>();

        var mainImg = ev.MainImageUrl != null && ev.MainImageUrl.StartsWith('/') && !ev.MainImageUrl.StartsWith("//", StringComparison.Ordinal)
            ? baseUrl + ev.MainImageUrl
            : ev.MainImageUrl;
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
            ev.GalleryUrls,
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

        var userId = _jwt.GetUserIdFromClaims(User);
        if (!ev.UserId.HasValue || ev.UserId != userId)
            return Forbid();

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
    public int DisplayDays { get; set; } = 30; // 7, 30, or 90 - required for save-draft
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
}

public record CountryCountDto(string Country, int Count);

public record SaveDraftResultDto(int DraftId, int DisplayDays, decimal Price, string Label);

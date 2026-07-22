using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Models;
using LifeEventsHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;

namespace LifeEventsHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly FileStorageService _fileStorage;
    private readonly JwtService _jwt;
    private readonly PricingService _pricing;
    private readonly StripeService _stripe;
    private readonly PricingOrderService _pricingOrders;
    private readonly AdminNotificationService _notifications;
    private readonly EventInviteEmailService _inviteEmail;

    public PaymentsController(
        AppDbContext db,
        FileStorageService fileStorage,
        JwtService jwt,
        PricingService pricing,
        StripeService stripe,
        PricingOrderService pricingOrders,
        AdminNotificationService notifications,
        EventInviteEmailService inviteEmail)
    {
        _db = db;
        _fileStorage = fileStorage;
        _jwt = jwt;
        _pricing = pricing;
        _stripe = stripe;
        _pricingOrders = pricingOrders;
        _notifications = notifications;
        _inviteEmail = inviteEmail;
    }

    [HttpGet("display-options")]
    [AllowAnonymous]
    public IActionResult GetDisplayOptions()
    {
        var options = _pricing.GetDisplayOptions()
            .Select(o => new { days = o.Days, price = o.Price, label = o.Label })
            .ToList();
        return Ok(options);
    }

    /// <summary>Create Stripe Checkout Session. Returns URL to redirect user to Stripe.</summary>
    [HttpPost("create-checkout-session")]
    [Authorize(Roles = "Admin,Customer")]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutRequest request, CancellationToken ct)
    {
        if (request.DraftId <= 0)
            return BadRequest(new { message = "Invalid draft ID." });

        var draft = await _db.PendingEvents.FindAsync(new object[] { request.DraftId }, ct);
        if (draft == null)
            return NotFound(new { message = "Draft not found or expired." });

        var userId = _jwt.GetUserIdFromClaims(User);
        if (draft.UserId.HasValue && draft.UserId != userId)
            return Forbid();

        if (!_stripe.IsConfigured)
            return BadRequest(new { message = "Stripe is not configured. Contact administrator." });

        var option = _pricing.GetOption(draft.DisplayDays);
        if (option == null)
            return BadRequest(new { message = "Invalid display duration." });

        string? customerEmail = null;
        if (userId.HasValue)
        {
            var user = await _db.Users.FindAsync(new object[] { userId.Value }, ct);
            customerEmail = user?.Email;
        }

        try
        {
            var useCustomerPortal = User.IsInRole("Customer");
            var session = useCustomerPortal
                ? await _stripe.CreateCustomerEventCheckoutSessionAsync(draft.Id, option.Price, option.Label, customerEmail, ct)
                : await _stripe.CreateCheckoutSessionAsync(draft.Id, option.Price, option.Label, customerEmail, ct);
            if (string.IsNullOrEmpty(session.Url))
                return BadRequest(new { message = "Stripe did not return a checkout URL. Check your Stripe dashboard and API key." });
            return Ok(new { url = session.Url });
        }
        catch (StripeException ex)
        {
            return BadRequest(new { message = $"Stripe could not start checkout: {ex.StripeError?.Message ?? ex.Message}" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Verify Stripe session and create event. Call after user returns from Stripe success redirect.</summary>
    [HttpPost("verify-session")]
    [Authorize(Roles = "Admin,Customer")]
    public async Task<ActionResult<EventDetailDto>> VerifySession([FromBody] VerifySessionRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.SessionId))
            return BadRequest(new { message = "Session ID is required." });

        var session = await _stripe.GetSessionAsync(request.SessionId, ct);
        if (session == null || session.PaymentStatus != "paid")
            return BadRequest(new { message = "Invalid or unpaid session." });

        var draftIdStr = session.Metadata?.GetValueOrDefault("draftId") ?? session.ClientReferenceId;
        if (string.IsNullOrEmpty(draftIdStr) || !int.TryParse(draftIdStr, out var draftId))
            return BadRequest(new { message = "Invalid session metadata." });

        return await CreateEventFromDraftAsync(draftId, ct);
    }

    /// <summary>Stripe webhook. Handle checkout.session.completed.</summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> StripeWebhook(CancellationToken ct)
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync(ct);
        var sig = Request.Headers["Stripe-Signature"].FirstOrDefault();

        var stripeEvent = _stripe.ConstructWebhookEvent(json, sig ?? "") as Stripe.Event;
        if (stripeEvent == null)
            return BadRequest();

        if (stripeEvent.Type == "checkout.session.completed")
        {
            var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
            if (string.Equals(session?.Metadata?.GetValueOrDefault("orderKind"), "pricingPlan", StringComparison.Ordinal)
                && !string.IsNullOrEmpty(session?.Id))
            {
                await _pricingOrders.CompletePaidPricingOrderFromStripeAsync(session.Id, ct);
                return Ok();
            }

            var draftIdStr = session?.Metadata?.GetValueOrDefault("draftId") ?? session?.ClientReferenceId;
            if (!string.IsNullOrEmpty(draftIdStr) && int.TryParse(draftIdStr, out var draftId))
            {
                var result = await CreateEventFromDraftAsync(draftId, ct);
                if (result.Result is OkObjectResult)
                    return Ok();
            }
        }
        return Ok();
    }

    private async Task<ActionResult<EventDetailDto>> CreateEventFromDraftAsync(int draftId, CancellationToken ct)
    {
        var draft = await _db.PendingEvents.FindAsync(new object[] { draftId }, ct);
        if (draft == null)
            return NotFound(new { message = "Draft not found or already used." });

        var userId = _jwt.GetUserIdFromClaims(User);
        if (draft.UserId.HasValue && draft.UserId != userId && !User.IsInRole("Admin"))
            return Forbid();

        return await CompleteCardPaymentForDraftAsync(draft, ct);
    }

    /// <summary>
    /// Customer card payment queues the draft for admin Payments (mark/publish).
    /// Admin-owned drafts publish immediately after card confirmation.
    /// </summary>
    private async Task<ActionResult<EventDetailDto>> CompleteCardPaymentForDraftAsync(
        PendingEvent draft,
        CancellationToken ct)
    {
        draft.PaymentMethod = "Card";

        var ownerIsCustomer = false;
        if (draft.UserId.HasValue)
        {
            var owner = await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == draft.UserId.Value, ct);
            ownerIsCustomer = owner != null && string.Equals(owner.Role, "Customer", StringComparison.OrdinalIgnoreCase);
        }

        if (ownerIsCustomer)
        {
            // Queue for admin: mark Received, then publish separately.
            draft.PaymentReceived = false;
            draft.AwaitingOfflineApproval = true;
            draft.OfflineSubmittedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            await _notifications.NotifyCustomerOfflineSubmittedAsync(draft, ct);
            // Customer must wait for admin mark/publish — no live event yet.
            return Ok(new EventDetailDto(
                0,
                draft.Title,
                draft.Description,
                draft.EventType,
                draft.EventDate,
                draft.BirthDate,
                draft.DeathDate,
                draft.WeddingDate,
                draft.Location,
                draft.Country,
                null,
                null,
                null,
                draft.CreatedBy,
                draft.CreatedAt,
                new List<WishDto>(),
                draft.Visibility,
                true,
                false,
                null
            ));
        }

        draft.PaymentReceived = true;
        return await PublishDraftAsync(draft, ct);
    }

    /// <summary>
    /// Persists the event, moves files from <c>{userId}/{draftId}</c> to <c>{userId}/{eventId}</c>, and rewrites stored paths.
    /// </summary>
    private async Task<ActionResult<EventDetailDto>> PublishDraftAsync(PendingEvent draft, CancellationToken ct)
    {
        var draftId = draft.Id;
        var draftMainPath = draft.MainImagePath;
        var draftGalleryJson = draft.GalleryPathsJson;
        var draftVideoJson = draft.VideoPathsJson;
        var invitedEmailsRaw = draft.InvitedEmails;
        var uid = draft.UserId ?? 0;

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var validityEnd = DateTime.UtcNow.AddDays(draft.DisplayDays);

        var ev = new LifeEventsHub.Api.Models.Event
        {
            Title = draft.Title,
            Description = draft.Description,
            EventType = draft.EventType,
            EventDate = draft.EventDate,
            BirthDate = draft.BirthDate,
            DeathDate = draft.DeathDate,
            WeddingDate = draft.WeddingDate,
            Location = draft.Location,
            Country = draft.Country,
            MainImageUrl = null,
            GalleryUrls = null,
            CreatedBy = draft.CreatedBy,
            UserId = draft.UserId,
            IsPublished = true,
            Visibility = draft.Visibility,
            DisplayDays = draft.DisplayDays,
            DisplayValidityEndDate = validityEnd,
            PaymentReceived = true,
            CurrencyCode = "USD",
            AmountPaid = draft.AmountPaid
        };

        _db.Events.Add(ev);
        _db.PendingEvents.Remove(draft);
        await _db.SaveChangesAsync(ct);

        _fileStorage.MoveDraftFolderToEventId(uid, draftId, ev.Id);

        // DB stores relative paths only; responses normalize with the base URL.
        ev.MainImageUrl = FileStorageService.RewriteMediaPathAfterPublish(draftMainPath, uid, draftId, ev.Id);
        ev.GalleryUrls = FileStorageService.RewriteGalleryJsonAfterPublish(draftGalleryJson, uid, draftId, ev.Id);
        ev.VideoUrls = FileStorageService.RewriteGalleryJsonAfterPublish(draftVideoJson, uid, draftId, ev.Id);

        await _db.SaveChangesAsync(ct);

        if (ev.Visibility == "InviteOnly" && !string.IsNullOrWhiteSpace(invitedEmailsRaw))
        {
            var emails = invitedEmailsRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();
            foreach (var email in emails)
            {
                if (string.IsNullOrEmpty(email)) continue;
                _db.EventInvites.Add(new EventInvite { EventId = ev.Id, InvitedEmail = email });
            }
            await _db.SaveChangesAsync(ct);

            if (emails.Count > 0)
            {
                await _inviteEmail.SendInvitesAsync(ev.Id, ev.Title, ev.CreatedBy, emails, ct);
            }
        }

        var invitedEmailsList = ev.Visibility == "InviteOnly"
            ? await _db.EventInvites.Where(i => i.EventId == ev.Id).Select(i => i.InvitedEmail).ToListAsync(ct)
            : new List<string>();

        await _notifications.ClearNotificationsOnPublishAsync(draftId, ct);

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

    /// <summary>Mock payment confirmation. Use when Stripe is not configured (e.g. local dev).</summary>
    [HttpPost("confirm-mock")]
    [Authorize(Roles = "Admin,Customer")]
    public async Task<IActionResult> ConfirmMock([FromBody] ConfirmPaymentRequest request, CancellationToken ct)
    {
        if (request.DraftId <= 0)
            return BadRequest(new { message = "Invalid draft ID." });

        var draft = await _db.PendingEvents.FindAsync(new object[] { request.DraftId }, ct);
        if (draft == null)
            return NotFound(new { message = "Draft not found or expired." });

        var userId = _jwt.GetUserIdFromClaims(User);
        if (draft.UserId.HasValue && draft.UserId != userId && !User.IsInRole("Admin"))
            return Forbid();

        var result = await CompleteCardPaymentForDraftAsync(draft, ct);
        if (result.Result is OkObjectResult ok && ok.Value is EventDetailDto ev && ev.Id == 0)
        {
            return Ok(new
            {
                awaitingApproval = true,
                draftId = draft.Id,
                message = "Card payment submitted. An admin will confirm payment and publish your event."
            });
        }

        return result.Result ?? Ok(result.Value);
    }

    /// <summary>Customer submits offline payment — draft awaits admin approval before feed publish.</summary>
    [HttpPost("submit-offline")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> SubmitOfflinePayment([FromBody] ConfirmPaymentRequest request, CancellationToken ct)
    {
        if (request.DraftId <= 0)
            return BadRequest(new { message = "Invalid draft ID." });

        var draft = await _db.PendingEvents.FindAsync(new object[] { request.DraftId }, ct);
        if (draft == null)
            return NotFound(new { message = "Draft not found." });

        var userId = _jwt.GetUserIdFromClaims(User);
        if (draft.UserId.HasValue && draft.UserId != userId && !User.IsInRole("Admin"))
            return Forbid();

        if (draft.AwaitingOfflineApproval)
            return Ok(new { message = "Already submitted for approval.", draftId = draft.Id });

        draft.PaymentMethod = "Offline";
        draft.PaymentReceived = false;
        draft.AwaitingOfflineApproval = true;
        draft.OfflineSubmittedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _notifications.NotifyCustomerOfflineSubmittedAsync(draft, ct);

        return Ok(new { message = "Submitted for admin approval. You will see it on the feed after approval.", draftId = draft.Id });
    }

    /// <summary>Admin: offline payment drafts awaiting approval.</summary>
    [HttpGet("pending-offline")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IReadOnlyList<CustomerDraftListDto>>> GetPendingOfflineApprovals(CancellationToken ct)
    {
        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var drafts = await _db.PendingEvents.AsNoTracking()
            .Where(d => d.AwaitingOfflineApproval)
            .OrderByDescending(d => d.OfflineSubmittedAt ?? d.CreatedAt)
            .ToListAsync(ct);

        var userIds = drafts
            .Where(d => d.UserId.HasValue)
            .Select(d => d.UserId!.Value)
            .Distinct()
            .ToList();
        var owners = userIds.Count == 0
            ? new Dictionary<int, (string DisplayName, string Email)>()
            : await _db.Users.AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => (u.DisplayName, u.Email), ct);

        var items = drafts.Select(d =>
        {
            string? ownerName = null;
            string? ownerEmail = null;
            if (d.UserId.HasValue && owners.TryGetValue(d.UserId.Value, out var owner))
            {
                ownerName = owner.DisplayName;
                ownerEmail = owner.Email;
            }

            return new CustomerDraftListDto(
                d.Id,
                d.Title,
                d.EventType,
                d.EventDate,
                d.DisplayDays,
                d.AmountPaid,
                d.AwaitingOfflineApproval,
                d.PaymentReceived,
                d.PaymentMethod,
                d.CreatedAt,
                FileStorageService.NormalizeUrl(d.MainImagePath, baseUrl),
                d.OfflineSubmittedAt,
                ownerName,
                ownerEmail
            );
        }).ToList();

        return Ok(items);
    }

    /// <summary>Admin: full detail for an offline-payment draft awaiting approval.</summary>
    [HttpGet("offline-draft/{draftId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CustomerDraftDetailDto>> GetOfflineDraftDetail(int draftId, CancellationToken ct)
    {
        var draft = await _db.PendingEvents.AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == draftId, ct);
        if (draft == null)
            return NotFound(new { message = "Draft not found or already published." });

        var owner = draft.UserId.HasValue
            ? await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == draft.UserId.Value, ct)
            : null;

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        var main = FileStorageService.NormalizeUrl(draft.MainImagePath, baseUrl);

        return Ok(new CustomerDraftDetailDto(
            draft.Id,
            draft.Title,
            draft.Description,
            draft.EventType,
            draft.EventDate,
            draft.BirthDate,
            draft.DeathDate,
            draft.WeddingDate,
            draft.Location,
            draft.Country,
            main,
            FileStorageService.NormalizeJsonArrayUrls(draft.GalleryPathsJson, baseUrl),
            FileStorageService.NormalizeJsonArrayUrls(draft.VideoPathsJson, baseUrl),
            draft.CreatedBy,
            draft.Visibility,
            draft.DisplayDays,
            draft.AmountPaid,
            draft.AwaitingOfflineApproval,
            draft.PaymentReceived,
            draft.PaymentMethod,
            draft.CreatedAt,
            draft.OfflineSubmittedAt,
            owner?.DisplayName,
            owner?.Email,
            draft.InvitedEmails
        ));
    }

    /// <summary>Admin marks customer draft payment as received (does not publish).</summary>
    [HttpPost("mark-offline-received/{draftId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> MarkOfflinePaymentReceived(int draftId, CancellationToken ct)
    {
        var draft = await _db.PendingEvents.FindAsync(new object[] { draftId }, ct);
        if (draft == null)
            return NotFound(new { message = "Draft not found." });
        if (!draft.AwaitingOfflineApproval)
            return BadRequest(new { message = "This draft is not awaiting payment confirmation." });

        draft.PaymentReceived = true;
        if (string.IsNullOrWhiteSpace(draft.PaymentMethod))
            draft.PaymentMethod = "Offline";
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>Admin publishes a customer draft only after payment is marked received.</summary>
    [HttpPost("approve-offline/{draftId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EventDetailDto>> ApproveOfflineDraft(int draftId, CancellationToken ct)
    {
        var draft = await _db.PendingEvents.FindAsync(new object[] { draftId }, ct);
        if (draft == null)
            return NotFound(new { message = "Draft not found." });
        if (!draft.AwaitingOfflineApproval)
            return BadRequest(new { message = "This draft is not awaiting offline approval." });
        if (!draft.PaymentReceived)
        {
            return BadRequest(new
            {
                message = "Payment is not received. Mark payment received before publishing this event."
            });
        }

        if (string.IsNullOrWhiteSpace(draft.PaymentMethod))
            draft.PaymentMethod = "Offline";
        return await PublishDraftAsync(draft, ct);
    }
}

public record CreateCheckoutRequest(int DraftId);
public record VerifySessionRequest(string SessionId);
public record ConfirmPaymentRequest(int DraftId);



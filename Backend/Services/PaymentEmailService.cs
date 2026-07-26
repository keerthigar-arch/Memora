using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.Templates;
using Microsoft.EntityFrameworkCore;

namespace LifeEventsHub.Api.Services;

public class PaymentEmailService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;
    private readonly ILogger<PaymentEmailService> _logger;

    public PaymentEmailService(
        AppDbContext db,
        IEmailService email,
        IConfiguration config,
        ILogger<PaymentEmailService> logger)
    {
        _db = db;
        _email = email;
        _config = config;
        _logger = logger;
    }

    public async Task SendCardPaymentSuccessAsync(
        int? userId,
        string eventTitle,
        string referenceCode,
        decimal amountPaid,
        int eventId,
        CancellationToken ct = default)
    {
        var owner = await ResolveOwnerAsync(userId, ct);
        if (owner == null) return;

        var html = PaymentEmailTemplate.BuildCardSuccess(
            owner.Value.DisplayName,
            eventTitle,
            referenceCode,
            amountPaid,
            CustomerEventUrl(eventId));

        await SendSafeAsync(
            owner.Value.Email,
            "Payment successful — Memora",
            html,
            ct);
    }

    public async Task SendOfflinePaymentPendingAsync(
        int? userId,
        string eventTitle,
        string referenceCode,
        decimal amountDue,
        CancellationToken ct = default)
    {
        var owner = await ResolveOwnerAsync(userId, ct);
        if (owner == null) return;

        var html = PaymentEmailTemplate.BuildOfflinePending(
            owner.Value.DisplayName,
            eventTitle,
            referenceCode,
            amountDue);

        await SendSafeAsync(
            owner.Value.Email,
            "Complete your offline payment — Memora",
            html,
            ct);
    }

    public async Task SendOfflinePublishedAsync(
        int? userId,
        string eventTitle,
        string referenceCode,
        decimal amountPaid,
        int eventId,
        CancellationToken ct = default)
    {
        var owner = await ResolveOwnerAsync(userId, ct);
        if (owner == null) return;

        var html = PaymentEmailTemplate.BuildOfflinePublished(
            owner.Value.DisplayName,
            eventTitle,
            referenceCode,
            amountPaid,
            CustomerEventUrl(eventId));

        await SendSafeAsync(
            owner.Value.Email,
            "Payment received — your event is live — Memora",
            html,
            ct);
    }

    private async Task<(string Email, string DisplayName)?> ResolveOwnerAsync(int? userId, CancellationToken ct)
    {
        if (!userId.HasValue) return null;
        var user = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId.Value)
            .Select(u => new { u.Email, u.DisplayName })
            .FirstOrDefaultAsync(ct);
        if (user == null || string.IsNullOrWhiteSpace(user.Email))
            return null;
        return (user.Email.Trim(), user.DisplayName ?? "");
    }

    private string? CustomerEventUrl(int eventId)
    {
        var baseUrl = (_config["CustomerPortal:BaseUrl"] ?? "http://localhost:4200").TrimEnd('/');
        return $"{baseUrl}/event/{eventId}";
    }

    private async Task SendSafeAsync(string to, string subject, string html, CancellationToken ct)
    {
        try
        {
            await _email.SendHtmlEmailAsync(to, subject, html, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send payment email to {Email}", to);
        }
    }
}

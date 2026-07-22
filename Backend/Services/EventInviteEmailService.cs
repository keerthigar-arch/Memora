using LifeEventsHub.Api.Templates;

namespace LifeEventsHub.Api.Services;

public class EventInviteEmailService
{
    private readonly IEmailService _email;
    private readonly IConfiguration _config;
    private readonly ILogger<EventInviteEmailService> _logger;

    public EventInviteEmailService(IEmailService email, IConfiguration config, ILogger<EventInviteEmailService> logger)
    {
        _email = email;
        _config = config;
        _logger = logger;
    }

    public async Task SendInvitesAsync(
        int eventId,
        string eventTitle,
        string invitedBy,
        IEnumerable<string> emails,
        CancellationToken cancellationToken = default)
    {
        var baseUrl = (_config["CustomerPortal:BaseUrl"] ?? "http://localhost:4200").TrimEnd('/');
        var eventUrl = $"{baseUrl}/event/{eventId}";
        var html = EventInviteEmailTemplate.Build(eventTitle, invitedBy, eventUrl);
        var subject = $"You're invited to {eventTitle} on Memora";

        foreach (var raw in emails)
        {
            var to = raw?.Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(to)) continue;
            try
            {
                await _email.SendHtmlEmailAsync(to, subject, html, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send invite email to {Email} for event {EventId}", to, eventId);
            }
        }
    }
}

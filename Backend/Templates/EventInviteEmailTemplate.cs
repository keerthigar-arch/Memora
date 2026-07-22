using System.Net;

namespace LifeEventsHub.Api.Templates;

public static class EventInviteEmailTemplate
{
    public static string Build(string eventTitle, string invitedBy, string eventUrl)
    {
        var safeTitle = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(eventTitle) ? "an event" : eventTitle.Trim());
        var safeBy = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(invitedBy) ? "someone" : invitedBy.Trim());

        var body = $"""
            <p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#1f2937;">Hello,</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
              <strong>{safeBy}</strong> invited you to <strong>{safeTitle}</strong> on Memora.
              Sign in with this email address to view it.
            </p>
            {EmailTemplateLayout.Button(eventUrl, "View event")}
            """;

        return EmailTemplateLayout.Wrap("You're invited", body);
    }
}

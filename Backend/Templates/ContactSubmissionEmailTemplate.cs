using System.Net;

namespace LifeEventsHub.Api.Templates;

public static class ContactSubmissionEmailTemplate
{
    public static string BuildForSupport(string name, string email, string subject, string message)
    {
        var safeName = WebUtility.HtmlEncode(name?.Trim() ?? "");
        var safeEmail = WebUtility.HtmlEncode(email?.Trim() ?? "");
        var safeSubject = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(subject) ? "(no subject)" : subject.Trim());
        var safeMessage = WebUtility.HtmlEncode(message?.Trim() ?? "").Replace("\n", "<br/>");

        var body = $"""
            <p style="margin:0 0 14px;font-size:15px;line-height:1.5;color:#4b5563;">New contact form message</p>
            <p style="margin:0 0 6px;font-size:14px;color:#374151;"><strong>Name:</strong> {safeName}</p>
            <p style="margin:0 0 6px;font-size:14px;color:#374151;"><strong>Email:</strong> {safeEmail}</p>
            <p style="margin:0 0 14px;font-size:14px;color:#374151;"><strong>Subject:</strong> {safeSubject}</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">{safeMessage}</p>
            """;

        return EmailTemplateLayout.Wrap("New contact message", body);
    }

    public static string BuildConfirmation(string name)
    {
        var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(name) ? "there" : name.Trim());
        var body = $"""
            <p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#1f2937;">Hi {safeName},</p>
            <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">
              Thanks for contacting Memora. We received your message and will reply soon.
            </p>
            """;

        return EmailTemplateLayout.Wrap("We received your message", body);
    }
}

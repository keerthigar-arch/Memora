using System.Net;

namespace LifeEventsHub.Api.Templates;

public static class PasswordResetEmailTemplate
{
    public static string Build(string recipientDisplayName, string resetUrl) =>
        Build(recipientDisplayName, resetUrl, forCustomer: false);

    public static string Build(string recipientDisplayName, string resetUrl, bool forCustomer)
    {
        var name = string.IsNullOrWhiteSpace(recipientDisplayName) ? "there" : recipientDisplayName.Trim();
        var safeName = WebUtility.HtmlEncode(name);
        var accountLabel = forCustomer ? "Memora account" : "Memora admin account";

        var body = $"""
            <p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#1f2937;">Hi {safeName},</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
              Reset the password for your {accountLabel}. This link expires in <strong>30 minutes</strong>.
            </p>
            {EmailTemplateLayout.Button(resetUrl, "Reset password")}
            <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#9ca3af;">
              If you did not request this, you can ignore this email.
            </p>
            """;

        return EmailTemplateLayout.Wrap("Reset your password", body, forCustomer ? null : "Admin");
    }
}

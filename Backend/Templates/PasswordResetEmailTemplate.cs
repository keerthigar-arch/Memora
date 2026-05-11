using System.Net;

namespace LifeEventsHub.Api.Templates;

public static class PasswordResetEmailTemplate
{
    /// <summary>Admin portal reset email.</summary>
    public static string Build(string recipientDisplayName, string resetUrl) =>
        Build(recipientDisplayName, resetUrl, forCustomer: false);

    /// <summary>HTML email with inline styles; set <paramref name="forCustomer"/> for customer site copy (no Admin header).</summary>
    public static string Build(string recipientDisplayName, string resetUrl, bool forCustomer)
    {
        var name = string.IsNullOrWhiteSpace(recipientDisplayName) ? "there" : recipientDisplayName.Trim();
        var safeName = WebUtility.HtmlEncode(name);

        var headerKicker = forCustomer
            ? """<p style="margin:0 0 6px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Memora</p>"""
            : """<p style="margin:0 0 6px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Admin</p>""";

        var bodyIntro = forCustomer
            ? """
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                We received a request to reset the password for your <strong style="color:#0d3d32;">Memora</strong> account.
                Use the button below to choose a new password. This link is valid for <strong>30 minutes</strong>.
              </p>
              """
            : """
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                We received a request to reset the password for your <strong style="color:#0d3d32;">Memora</strong> admin account.
                Use the button below to choose a new password. This link is valid for <strong>30 minutes</strong>.
              </p>
              """;

        return $"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#eef2f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 28px rgba(13,61,50,0.12);border:1px solid #d8e3de;">
          <tr>
            <td style="background:linear-gradient(135deg,#0d3d32 0%,#1a5f4a 100%);padding:28px 32px;text-align:center;">
              {headerKicker}
              <h1 style="margin:0;font-size:26px;font-weight:600;color:#ffffff;font-family:Georgia,'Times New Roman',serif;">Memora</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#1f2937;">Hi {safeName},</p>
              {bodyIntro}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 28px;">
                <tr>
                  <td align="center" bgcolor="#1a5f4a" style="border-radius:8px;">
                    <a href="{resetUrl}" target="_blank" rel="noopener noreferrer"
                       style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:#1a5f4a;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:#6b7280;">
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;line-height:1.5;word-break:break-all;color:#0d3d32;background:#f0f7f4;padding:12px 14px;border-radius:8px;border:1px solid #cfe8dc;">
                {WebUtility.HtmlEncode(resetUrl)}
              </p>
              <p style="margin:0;font-size:13px;line-height:1.55;color:#9ca3af;">
                If you did not request a password reset, you can ignore this email. Your password will stay the same.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e5e7eb;background-color:#fafafa;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af;text-align:center;">
                © Memora · This message was sent automatically. Do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""";
    }
}

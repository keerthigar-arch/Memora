using System.Net;

namespace LifeEventsHub.Api.Templates;

/// <summary>Shared Memora email chrome. Leaf icon is embedded as cid:memora-logo by EmailService.</summary>
public static class EmailTemplateLayout
{
    public const string LogoContentId = "memora-logo";

    public static string Wrap(string title, string bodyHtml, string? headerSubtitle = null)
    {
        var safeTitle = WebUtility.HtmlEncode(title);
        var subtitleHtml = string.IsNullOrWhiteSpace(headerSubtitle)
            ? ""
            : $"""
              <tr>
                <td colspan="2" style="padding-top:8px;font-size:12px;letter-spacing:0.04em;color:#5a6f68;text-align:left;">
                  {WebUtility.HtmlEncode(headerSubtitle)}
                </td>
              </tr>
              """;

        // Logo matches site brand: leaf icon + serif "Memora" on light header.
        return $"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#eef2f0;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #d8e3de;">
          <tr>
            <td style="background-color:#f5f7f6;padding:20px 24px;border-bottom:1px solid #e5eeea;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="cid:{LogoContentId}" width="28" height="28" alt=""
                         style="display:block;border:0;outline:none;width:28px;height:28px;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-family:Georgia,'Times New Roman',Times,serif;font-size:24px;font-weight:600;color:#1e4638;letter-spacing:0.01em;line-height:1;">Memora</span>
                  </td>
                </tr>
                {subtitleHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              {bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 22px;border-top:1px solid #e5e7eb;background-color:#fafafa;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af;text-align:center;">© Memora</p>
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

    public static string Button(string href, string label) => $"""
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:8px auto 0;">
  <tr>
    <td align="center" bgcolor="#1a5f4a" style="border-radius:8px;">
      <a href="{href}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:#1a5f4a;">
        {WebUtility.HtmlEncode(label)}
      </a>
    </td>
  </tr>
</table>
""";
}

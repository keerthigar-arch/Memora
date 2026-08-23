using System.Globalization;
using System.Net;

namespace LifeEventsHub.Api.Templates;

public static class PaymentEmailTemplate
{
    public static string BuildCardSuccess(
        string recipientDisplayName,
        string eventTitle,
        string referenceCode,
        decimal amountPaid,
        string? eventUrl)
    {
        var name = SafeName(recipientDisplayName);
        var title = WebUtility.HtmlEncode(eventTitle);
        var reference = WebUtility.HtmlEncode(referenceCode);
        var amount = FormatUsd(amountPaid);
        var button = string.IsNullOrWhiteSpace(eventUrl)
            ? ""
            : EmailTemplateLayout.Button(eventUrl, "View your event");

        var body = $"""
            <p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#1f2937;">Hi {name},</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563;">
              Your payment for <strong>{title}</strong> was successful. Your event is now live on Memora.
            </p>
            {ReferenceBox(reference, amount)}
            {button}
            <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#9ca3af;">
              Keep this reference number for your records.
            </p>
            """;

        return EmailTemplateLayout.Wrap("Payment successful", body, "Online payment confirmation");
    }

    public static string BuildCardPendingApproval(
        string recipientDisplayName,
        string eventTitle,
        string referenceCode,
        decimal amountPaid)
    {
        var name = SafeName(recipientDisplayName);
        var title = WebUtility.HtmlEncode(eventTitle);
        var reference = WebUtility.HtmlEncode(referenceCode);
        var amount = FormatUsd(amountPaid);

        var body = $"""
            <p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#1f2937;">Hi {name},</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563;">
              Your payment for <strong>{title}</strong> was successful. Our team will review your event shortly.
              It will appear on the Memora feed once an admin approves it.
            </p>
            {ReferenceBox(reference, amount)}
            <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#9ca3af;">
              Keep this reference number for your records.
            </p>
            """;

        return EmailTemplateLayout.Wrap("Payment received", body, "Awaiting admin approval");
    }

    public static string BuildOfflinePending(
        string recipientDisplayName,
        string eventTitle,
        string referenceCode,
        decimal amountDue)
    {
        var name = SafeName(recipientDisplayName);
        var title = WebUtility.HtmlEncode(eventTitle);
        var reference = WebUtility.HtmlEncode(referenceCode);
        var amount = FormatUsd(amountDue);

        var body = $"""
            <p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#1f2937;">Hi {name},</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563;">
              You chose offline payment for <strong>{title}</strong>. Please complete your payment using the reference below.
              Your event will be published on the feed only after we confirm payment.
            </p>
            {ReferenceBox(reference, amount)}
            <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#4b5563;">
              Use this reference when making your transfer so we can match your payment quickly.
            </p>
            """;

        return EmailTemplateLayout.Wrap("Complete your payment", body, "Offline payment instructions");
    }

    public static string BuildOfflinePublished(
        string recipientDisplayName,
        string eventTitle,
        string referenceCode,
        decimal amountPaid,
        string? eventUrl)
    {
        var name = SafeName(recipientDisplayName);
        var title = WebUtility.HtmlEncode(eventTitle);
        var reference = WebUtility.HtmlEncode(referenceCode);
        var amount = FormatUsd(amountPaid);
        var button = string.IsNullOrWhiteSpace(eventUrl)
            ? ""
            : EmailTemplateLayout.Button(eventUrl, "View your event");

        var body = $"""
            <p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#1f2937;">Hi {name},</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563;">
              Great news — we received your offline payment for <strong>{title}</strong>, and your event is now published on the Memora feed.
            </p>
            {ReferenceBox(reference, amount)}
            {button}
            <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#9ca3af;">
              Thank you for choosing Memora.
            </p>
            """;

        return EmailTemplateLayout.Wrap("Payment received & published", body, "Offline payment confirmation");
    }

    private static string ReferenceBox(string safeReference, string safeAmount) => $"""
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
               style="margin:8px 0 18px;background:#f5f7f6;border:1px solid #d8e3de;border-radius:10px;">
          <tr>
            <td style="padding:16px 18px;">
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#5a6f68;font-weight:700;">
                Reference
              </p>
              <p style="margin:0 0 14px;font-size:18px;font-weight:700;color:#1e4638;letter-spacing:0.02em;font-family:Consolas,Monaco,monospace;">
                {safeReference}
              </p>
              <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#5a6f68;font-weight:700;">
                Amount
              </p>
              <p style="margin:0;font-size:16px;font-weight:600;color:#1f2937;">{safeAmount}</p>
            </td>
          </tr>
        </table>
        """;

    private static string SafeName(string recipientDisplayName)
    {
        var name = string.IsNullOrWhiteSpace(recipientDisplayName) ? "there" : recipientDisplayName.Trim();
        return WebUtility.HtmlEncode(name);
    }

    private static string FormatUsd(decimal amount) =>
        amount.ToString("C", CultureInfo.GetCultureInfo("en-US"));
}

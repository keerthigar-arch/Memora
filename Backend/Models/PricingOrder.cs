using System.ComponentModel.DataAnnotations;

namespace LifeEventsHub.Api.Models;

/// <summary>Pricing-page package order (direct bank-style or Stripe card).</summary>
public class PricingOrder
{
    public int Id { get; set; }

    /// <summary>Human-facing reference (e.g. MEM-2026-XXXXXXXX). Assigned when order is confirmed.</summary>
    [MaxLength(40)]
    public string? ReferenceCode { get; set; }

    /// <summary>pending_payment | direct_open | paid_card (legacy: paid_direct)</summary>
    [MaxLength(32)]
    public string Status { get; set; } = "pending_payment";

    /// <summary>Direct | Card</summary>
    [MaxLength(16)]
    public string PaymentChannel { get; set; } = "";

    [MaxLength(64)]
    public string Category { get; set; } = "";

    [MaxLength(64)]
    public string Country { get; set; } = "";

    public int PackageColumnIndex { get; set; }

    [MaxLength(48)]
    public string PackageDayLabel { get; set; } = "";

    [MaxLength(64)]
    public string AmountDisplay { get; set; } = "";

    [MaxLength(120)]
    public string WordLimitDisplay { get; set; } = "";

    [MaxLength(16)]
    public string CurrencyCode { get; set; } = "LKR";

    [MaxLength(160)]
    public string CustomerName { get; set; } = "";

    [MaxLength(48)]
    public string CustomerPhone { get; set; } = "";

    [MaxLength(200)]
    public string CustomerEmail { get; set; } = "";

    [MaxLength(128)]
    public string? StripeSessionId { get; set; }

    [MaxLength(128)]
    public string? StripePaymentIntentId { get; set; }

    /// <summary>Stripe AmountTotal (smallest currency unit).</summary>
    public long? PaidAmountMinorUnits { get; set; }

    [MaxLength(16)]
    public string? PaidCurrencyCode { get; set; }

    /// <summary>For Direct channel: admin confirms bank transfer / manual payment received.</summary>
    public bool DirectManualPaymentReceived { get; set; }

    public DateTime? DirectManualPaymentMarkedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }
}

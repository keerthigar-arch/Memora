namespace LifeEventsHub.Api.DTOs;

public record PricingOrderAdminDto(
    int Id,
    string? ReferenceCode,
    string Status,
    string PaymentChannel,
    string Category,
    string Country,
    string PackageDayLabel,
    string AmountDisplay,
    string CurrencyCode,
    string CustomerName,
    string CustomerPhone,
    string CustomerEmail,
    string? StripeSessionId,
    string? StripePaymentIntentId,
    long? PaidAmountMinorUnits,
    string? PaidCurrencyCode,
    bool DirectManualPaymentReceived,
    DateTime? DirectManualPaymentMarkedAt,
    DateTime CreatedAt,
    DateTime? CompletedAt);

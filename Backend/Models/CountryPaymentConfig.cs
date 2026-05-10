using System.Collections.Generic;

namespace LifeEventsHub.Api.Models
{
    public class CountryPaymentConfig
    {
        public int Id { get; set; }
        public string CountryCode { get; set; } = string.Empty;
        public string CountryName { get; set; } = string.Empty;
        public string CurrencyCode { get; set; } = string.Empty;
        public string CurrencySymbol { get; set; } = string.Empty;
        public List<Stripe.PaymentMethod> AvailablePaymentMethods { get; set; } = new();
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
// Models/Currency.cs
namespace LifeEventsHub.API.Models
{
    public class Currency
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Symbol { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public decimal ExchangeRate { get; set; } // Relative to USD
    }
}
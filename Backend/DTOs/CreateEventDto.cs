// Models/DTOs/CreateEventDto.cs
using System.ComponentModel.DataAnnotations;

namespace LifeEventsHub.API.Models.DTOs
{
    public class CreateEventDto
    {
        [Required] public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        [Required] public string Country { get; set; } = string.Empty;
        [Required] public string CurrencyCode { get; set; } = string.Empty;
        [Required] public string Duration { get; set; } = string.Empty;
        public string Visibility { get; set; } = "Public";
        public string? Location { get; set; }
    }

    public class PaymentIntentDto
    {
        [Required] public string CurrencyCode { get; set; } = string.Empty;
        [Required] public string Duration { get; set; } = string.Empty;
        public int? EventId { get; set; }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }

        public static ApiResponse<T> Ok(T data, string message = "Success") =>
            new() { Success = true, Data = data, Message = message };

        public static ApiResponse<T> Fail(string message) =>
            new() { Success = false, Message = message };
    }

    public class CurrencyRateResponseDto
    {
        public bool Success { get; set; }
        public Dictionary<string, decimal> Rates { get; set; } = new();
        public DateTime LastUpdated { get; set; }
    }

    public class PaymentIntentResponseDto
    {
        public string ClientSecret { get; set; } = string.Empty;
        public string PaymentIntentId { get; set; } = string.Empty;
        public decimal AmountInCurrency { get; set; }
        public string CurrencyCode { get; set; } = string.Empty;
        public decimal ExchangeRate { get; set; }
    }

    public class DisplayPlanDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int Days { get; set; }
        public decimal PriceUSD { get; set; }
        public decimal PriceInCurrency { get; set; }
        public decimal PerDayUSD { get; set; }
        public decimal PerDayInCurrency { get; set; }
        public string FormattedPrice { get; set; } = string.Empty;
        public string FormattedPerDay { get; set; } = string.Empty;
        public string CurrencySymbol { get; set; } = string.Empty;
    }
}
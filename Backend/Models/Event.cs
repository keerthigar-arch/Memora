using System.ComponentModel.DataAnnotations;

namespace LifeEventsHub.Api.Models;

public class Event
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string EventType { get; set; } = string.Empty; // Birthday, Obituary, Anniversary

    public DateTime EventDate { get; set; }

    public DateTime? BirthDate { get; set; }

    public DateTime? DeathDate { get; set; }

    public DateTime? WeddingDate { get; set; } // For Anniversary events

    [MaxLength(300)]
    public string? Location { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }


     [Required]
        public string CurrencyCode { get; set; } = string.Empty;  // e.g., LKR, GBP

        public decimal AmountGBP { get; set; }       // Always stored in GBP
        public decimal AmountPaid { get; set; }      // In selected currency
        public decimal ExchangeRateUsed { get; set; }// Rate at time of payment


    [MaxLength(500)]
    public string? MainImageUrl { get; set; }

    public string? GalleryUrls { get; set; } // JSON array of image URLs

    [Required]
    [MaxLength(200)]
    public string CreatedBy { get; set; } = string.Empty;

    public int? UserId { get; set; }
    public User? User { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsPublished { get; set; } = true;

    [MaxLength(20)]
    public string Visibility { get; set; } = "Public"; // Public, Private, InviteOnly

    /// <summary>Number of days the event should be displayed (based on payment tier).</summary>
    public int? DisplayDays { get; set; }

    /// <summary>After this date the event is hidden from the UI. Null = legacy events, shown indefinitely.</summary>
    public DateTime? DisplayValidityEndDate { get; set; }

    public bool PaymentReceived { get; set; }

    public ICollection<Wish> Wishes { get; set; } = new List<Wish>();
    public ICollection<EventInvite> Invites { get; set; } = new List<EventInvite>();
}

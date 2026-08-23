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
    public string EventType { get; set; } = string.Empty;

    public DateTime EventDate { get; set; }

    public DateTime? BirthDate { get; set; }

    public DateTime? DeathDate { get; set; }

    public DateTime? WeddingDate { get; set; }

    [MaxLength(300)]
    public string? Location { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }

    [Required]
    [MaxLength(16)]
    public string CurrencyCode { get; set; } = "USD";

    public decimal AmountGBP { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal ExchangeRateUsed { get; set; }

    [MaxLength(500)]
    public string? MainImageUrl { get; set; }

    public string? GalleryUrls { get; set; }

    public string? VideoUrls { get; set; }

    /// <summary>Confirmation document for Wedding / Obituary (Funeral) — under Event/{id}/document/.</summary>
    [MaxLength(500)]
    public string? ConfirmationDocumentUrl { get; set; }

    [Required]
    [MaxLength(200)]
    public string CreatedBy { get; set; } = string.Empty;

    public int? UserId { get; set; }
    public User? User { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsPublished { get; set; } = true;

    [MaxLength(20)]
    public string Visibility { get; set; } = "Public";

    public int? DisplayDays { get; set; }

    public DateTime? DisplayValidityEndDate { get; set; }

    public bool PaymentReceived { get; set; }

    /// <summary>How the event was paid: Card, Offline, or null for legacy/admin unmarked.</summary>
    [MaxLength(20)]
    public string? PaymentMethod { get; set; }

    /// <summary>Customer-facing payment reference (MEM-YYYY-XXXXXXXX).</summary>
    [MaxLength(40)]
    public string? ReferenceCode { get; set; }

    public ICollection<Wish> Wishes { get; set; } = new List<Wish>();
    public ICollection<EventInvite> Invites { get; set; } = new List<EventInvite>();
}

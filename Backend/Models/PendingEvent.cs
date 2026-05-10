namespace LifeEventsHub.Api.Models;

/// <summary>Draft event saved before payment. Converted to Event after payment success.</summary>
public class PendingEvent
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public User? User { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? DeathDate { get; set; }
    public DateTime? WeddingDate { get; set; }
    public string? Location { get; set; }
    public string? Country { get; set; }
    public string? MainImagePath { get; set; }
    public string? GalleryPathsJson { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string Visibility { get; set; } = "Public";
    public string? InvitedEmails { get; set; }

    public int DisplayDays { get; set; }
    public decimal AmountPaid { get; set; }
    public bool PaymentReceived { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

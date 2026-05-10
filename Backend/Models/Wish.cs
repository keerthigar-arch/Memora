using System.ComponentModel.DataAnnotations;

namespace LifeEventsHub.Api.Models;

public class Wish
{
    public int Id { get; set; }

    public int EventId { get; set; }
    public Event Event { get; set; } = null!;

    [Required]
    [MaxLength(150)]
    public string SenderName { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? MediaUrl { get; set; } // Photo or video URL for tributes/wishes

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

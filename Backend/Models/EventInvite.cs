using System.ComponentModel.DataAnnotations;

namespace LifeEventsHub.Api.Models;

public class EventInvite
{
    public int Id { get; set; }

    public int EventId { get; set; }
    public Event Event { get; set; } = null!;

    [Required]
    [MaxLength(256)]
    public string InvitedEmail { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

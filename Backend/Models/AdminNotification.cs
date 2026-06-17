using System.ComponentModel.DataAnnotations;

namespace LifeEventsHub.Api.Models;

/// <summary>
/// Admin notification row — references an event or pending draft only (no duplicated event fields).
/// </summary>
public class AdminNotification
{
    public int Id { get; set; }

    /// <summary>Published customer event.</summary>
    public int? EventId { get; set; }

    /// <summary>Offline draft awaiting approval (cleared when published).</summary>
    public int? PendingEventId { get; set; }

    /// <summary>CustomerEventPublished | CustomerEventOffline</summary>
    [Required]
    [MaxLength(40)]
    public string Kind { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime? ReadAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

using System.ComponentModel.DataAnnotations;

namespace LifeEventsHub.Api.Models;

public class ContactSubmission
{
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Subject { get; set; }

    [Required]
    public string Message { get; set; } = string.Empty;

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public bool IsRead { get; set; }
}

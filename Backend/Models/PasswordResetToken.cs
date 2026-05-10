using System.ComponentModel.DataAnnotations;

namespace LifeEventsHub.Api.Models;

public class PasswordResetToken
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [MaxLength(128)]
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UsedAt { get; set; }
}

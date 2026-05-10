using System.ComponentModel.DataAnnotations;

namespace LifeEventsHub.Api.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    /// <summary>Optional handle for login (same password as email login). Set manually for admins; must be unique when not null.</summary>
    [MaxLength(64)]
    public string? UserName { get; set; }

    [Required]
    [MaxLength(500)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string DisplayName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Bio { get; set; }

    [MaxLength(500)]
    public string? ProfileImageUrl { get; set; }

    [MaxLength(20)]
    public string ProfileVisibility { get; set; } = "Public"; // Public, Private, FriendsOnly

    public bool ShowEmail { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Customer (browse / wishes) or Admin (create & manage events).</summary>
    [MaxLength(20)]
    public string Role { get; set; } = "Customer";

    /// <summary>When true, admin must change password before using the app (first login with temporary password).</summary>
    public bool MustChangePassword { get; set; }
}

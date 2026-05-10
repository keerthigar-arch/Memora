namespace LifeEventsHub.Api.DTOs;

public record UserProfileDto(
    int Id,
    string Email,
    string DisplayName,
    string? Bio,
    string? ProfileImageUrl,
    string ProfileVisibility,
    bool ShowEmail,
    DateTime CreatedAt,
    string Role,
    bool MustChangePassword
);

/// <summary>Admin list row: registered customers (same fields as public registration profile, plus event count).</summary>
public record CustomerAdminListDto(
    int Id,
    string Email,
    string DisplayName,
    string? Bio,
    string? ProfileImageUrl,
    string ProfileVisibility,
    bool ShowEmail,
    DateTime CreatedAt,
    int EventCount
);

public record UpdateProfileDto(
    string? DisplayName,
    string? Bio,
    string? ProfileImageUrl
);

public record UpdatePrivacyDto(
    string? ProfileVisibility, // Public, Private, FriendsOnly
    bool? ShowEmail
);

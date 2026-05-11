namespace LifeEventsHub.Api.DTOs;

public record RegisterDto(string Email, string Password, string DisplayName);

public record LoginDto(string Email, string Password);

public record AuthResponseDto(string Token, UserProfileDto User);

public record ChangePasswordDto(string CurrentPassword, string NewPassword);

/// <summary>First-login only: user already proved password at login; JWT + MustChangePassword gate this call.</summary>
public record FirstLoginNewPasswordDto(string NewPassword);

/// <param name="Portal">Optional: <c>customer</c> for customer site reset; omit or <c>admin</c> for admin.</param>
public record ForgotPasswordRequestDto(string UserName, string? Portal = null);

public record ResetPasswordValidateDto(bool Valid, bool Expired);

public record ResetPasswordWithTokenDto(string Token, string NewPassword);

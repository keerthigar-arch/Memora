using System.Security.Cryptography;
using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Models;
using LifeEventsHub.Api.Services;
using LifeEventsHub.Api.Templates;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LifeEventsHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwt;
    private readonly FileStorageService _fileStorage;
    private readonly IEmailService _email;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _env;
    private readonly ILogger<AuthController> _log;

    public AuthController(
        AppDbContext db,
        JwtService jwt,
        FileStorageService fileStorage,
        IEmailService email,
        IConfiguration configuration,
        IHostEnvironment env,
        ILogger<AuthController> log)
    {
        _db = db;
        _jwt = jwt;
        _fileStorage = fileStorage;
        _email = email;
        _configuration = configuration;
        _env = env;
        _log = log;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password) || string.IsNullOrWhiteSpace(dto.DisplayName))
            return BadRequest(new { message = "Email, password, and display name are required." });

        var email = dto.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email))
            return BadRequest(new { message = "An account with this email already exists." });

        if (dto.Password.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            DisplayName = dto.DisplayName.Trim(),
            Role = "Customer"
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _jwt.GenerateToken(user);
        return Ok(new AuthResponseDto(token, ToProfile(user)));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Email or username and password are required." });

        var loginKey = dto.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Email == loginKey
            || (u.UserName != null && u.UserName.Trim().ToLower() == loginKey));
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email, username, or password." });

        var token = _jwt.GenerateToken(user);
        return Ok(new AuthResponseDto(token, ToProfile(user)));
    }

    /// <summary>First-login password set: Admin JWT + MustChangePassword (user already authenticated at login).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("first-login-password")]
    public async Task<ActionResult<UserProfileDto>> FirstLoginPassword([FromBody] FirstLoginNewPasswordDto dto)
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId.Value);
        if (user == null) return NotFound();

        if (!user.MustChangePassword)
            return BadRequest(new { message = "No pending password change is required for this account." });

        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
            return BadRequest(new { message = "New password must be at least 6 characters." });

        if (BCrypt.Net.BCrypt.Verify(dto.NewPassword, user.PasswordHash))
            return BadRequest(new { message = "New password must be different from your temporary password." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.MustChangePassword = false;
        await _db.SaveChangesAsync();

        return Ok(ToProfile(user));
    }

    /// <summary>
    /// Request password reset email (30-minute token).
    /// Use <see cref="ForgotPasswordRequestDto.Portal"/> <c>customer</c> for customer accounts; omit or <c>admin</c> for admins.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto, CancellationToken cancellationToken)
    {
        var key = dto.UserName?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(key))
            return BadRequest(new { message = "Username is required." });

        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Email == key
            || (u.UserName != null && u.UserName.Trim().ToLower() == key), cancellationToken);

        var forCustomer = IsCustomerPortalForgot(dto.Portal);
        if (user == null
            || (forCustomer && !IsCustomerRole(user.Role))
            || (!forCustomer && !IsAdminRole(user.Role)))
            return BadRequest(new { message = "Invalid User!" });

        var oldTokens = await _db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null)
            .ToListAsync(cancellationToken);
        _db.PasswordResetTokens.RemoveRange(oldTokens);

        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var entity = new PasswordResetToken
        {
            UserId = user.Id,
            Token = rawToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            CreatedAt = DateTime.UtcNow
        };
        _db.PasswordResetTokens.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        var baseUrl = forCustomer
            ? (_configuration["CustomerPortal:BaseUrl"] ?? "http://localhost:4200").TrimEnd('/')
            : (_configuration["AdminPortal:BaseUrl"] ?? "http://localhost:4201").TrimEnd('/');
        var resetUrl = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}";
        var html = PasswordResetEmailTemplate.Build(user.DisplayName, resetUrl, forCustomer);
        var subject = forCustomer
            ? "Reset your Memora password"
            : "Reset your Memora admin password";
        try
        {
            await _email.SendHtmlEmailAsync(
                user.Email,
                subject,
                html,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Forgot-password email failed for user id {UserId} (customer={ForCustomer})", user.Id, forCustomer);
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Unable to send reset email right now. Please contact administrator.",
                detail = ex.Message
            });
        }

        var devSkip = _env.IsDevelopment() && _configuration.GetValue("Smtp:DevLogOnly", false);
        if (devSkip)
        {
            return Ok(new
            {
                message =
                    "Development mode: real email was not sent (Smtp:DevLogOnly). Use the reset link below.",
                devEmailSkipped = true,
                resetUrl
            });
        }

        return Ok(new { message = "Password reset instructions have been sent to your email address." });
    }

    [AllowAnonymous]
    [HttpGet("reset-password/validate")]
    public async Task<ActionResult<ResetPasswordValidateDto>> ValidateResetPasswordToken(
        [FromQuery] string? token,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
            return Ok(new ResetPasswordValidateDto(false, false));

        var normalized = token.Trim().ToLowerInvariant();
        var row = await _db.PasswordResetTokens.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Token == normalized, cancellationToken);
        if (row == null)
            return Ok(new ResetPasswordValidateDto(false, false));

        if (row.UsedAt != null || row.ExpiresAt <= DateTime.UtcNow)
            return Ok(new ResetPasswordValidateDto(false, true));

        return Ok(new ResetPasswordValidateDto(true, false));
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPasswordWithToken(
        [FromBody] ResetPasswordWithTokenDto dto,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { message = "Token and new password are required." });

        if (dto.NewPassword.Length < 6)
            return BadRequest(new { message = "New password must be at least 6 characters." });

        var normalized = dto.Token.Trim().ToLowerInvariant();
        var row = await _db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == normalized, cancellationToken);

        if (row == null)
            return BadRequest(new { message = "Invalid or expired reset link.", expired = false });

        if (row.UsedAt != null)
            return BadRequest(new { message = "This reset link has already been used.", expired = true });

        if (row.ExpiresAt <= DateTime.UtcNow)
            return BadRequest(new { message = "This reset link has expired. Request a new one.", expired = true });

        var user = row.User;
        if (!CanUsePasswordResetToken(user.Role))
            return BadRequest(new { message = "Invalid or expired reset link.", expired = false });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.MustChangePassword = false;
        row.UsedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Password updated. You can sign in now." });
    }

    /// <summary>
    /// Temporary helper for local debugging only. Remove after use.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("debug/hash")]
    public IActionResult GenerateDebugHash([FromQuery] string? password)
    {
        if (!_env.IsDevelopment())
            return NotFound();

        if (string.IsNullOrWhiteSpace(password))
            return BadRequest(new { message = "Password query value is required." });

        var hash = BCrypt.Net.BCrypt.HashPassword(password);
        return Ok(new { hash });
    }

    private static bool IsAdminRole(string? role) =>
        string.Equals(role?.Trim(), "Admin", StringComparison.OrdinalIgnoreCase);

    private static bool IsCustomerRole(string? role) =>
        string.Equals(role?.Trim(), "Customer", StringComparison.OrdinalIgnoreCase);

    private static bool IsCustomerPortalForgot(string? portal) =>
        string.Equals(portal?.Trim(), "customer", StringComparison.OrdinalIgnoreCase);

    /// <summary>Password reset tokens may complete for Admin or Customer accounts.</summary>
    private static bool CanUsePasswordResetToken(string? role) =>
        IsAdminRole(role) || IsCustomerRole(role);

    private static UserProfileDto ToProfile(User u) => new(
        u.Id, u.Email, u.DisplayName, u.Bio, u.ProfileImageUrl,
        u.ProfileVisibility, u.ShowEmail, u.CreatedAt,
        string.IsNullOrWhiteSpace(u.Role) ? "Customer" : u.Role,
        u.MustChangePassword);
}

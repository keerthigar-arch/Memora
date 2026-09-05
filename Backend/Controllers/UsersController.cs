using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Models;
using LifeEventsHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LifeEventsHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwt;
    private readonly FileStorageService _fileStorage;
    private readonly AdminCustomerListService _adminCustomerList;

    public UsersController(
        AppDbContext db,
        JwtService jwt,
        FileStorageService fileStorage,
        AdminCustomerListService adminCustomerList)
    {
        _db = db;
        _jwt = jwt;
        _fileStorage = fileStorage;
        _adminCustomerList = adminCustomerList;
    }

    /// <summary>Same data as <c>GET /api/admin/users/customers</c> (legacy path for admin tools).</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("customers")]
    public async Task<ActionResult<PagedResult<CustomerAdminListDto>>> ListCustomers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminCustomerList.ListPagedAsync(page, pageSize, search, cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> GetProfile()
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId.Value);
        if (user == null)
            return Unauthorized(new { message = "Your session is no longer valid. Please sign in again." });

        return Ok(ToProfile(user));
    }

    [Authorize]
    [HttpPut("me")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile([FromForm] string? displayName, [FromForm] string? bio, [FromForm] IFormFile? profileImage)
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId.Value);
        if (user == null)
            return Unauthorized(new { message = "Your session is no longer valid. Please sign in again." });

        if (displayName != null)
        {
            var trimmed = displayName.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
                return BadRequest(new { message = "Display name cannot be empty." });
            if (trimmed.Length > 150)
                return BadRequest(new { message = "Display name must be 150 characters or fewer." });
            user.DisplayName = trimmed;
        }

        if (bio != null)
            user.Bio = string.IsNullOrWhiteSpace(bio) ? null : bio.Trim();

        if (profileImage != null)
        {
            if (profileImage.Length == 0)
                return BadRequest(new { message = "Profile image file is empty." });

            var isAdmin = string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase);
            string? url;
            try
            {
                url = isAdmin
                    ? await _fileStorage.SaveAdminProfileImageAsync(profileImage, userId.Value)
                    : await _fileStorage.SaveCustomerProfileImageAsync(profileImage, userId.Value);
            }
            catch (IOException ex)
            {
                return StatusCode(500, new { message = "Could not save profile image on disk.", detail = ex.Message });
            }

            if (url == null)
                return BadRequest(new { message = "Invalid profile image. Use PNG, JPG, GIF, or WebP up to 5 MB." });

            var baseUrl = _fileStorage.GetBaseUrl(Request);
            user.ProfileImageUrl = baseUrl + url;
        }

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            return StatusCode(500, new { message = "Could not save profile changes.", detail = ex.InnerException?.Message ?? ex.Message });
        }

        return Ok(ToProfile(user));
    }

    [Authorize]
    [HttpPut("me/privacy")]
    public async Task<ActionResult<UserProfileDto>> UpdatePrivacy([FromBody] UpdatePrivacyDto dto)
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId.Value);
        if (user == null)
            return Unauthorized(new { message = "Your session is no longer valid. Please sign in again." });

        if (dto.ProfileVisibility != null && new[] { "Public", "Private", "FriendsOnly" }.Contains(dto.ProfileVisibility))
            user.ProfileVisibility = dto.ProfileVisibility;
        if (dto.ShowEmail.HasValue)
            user.ShowEmail = dto.ShowEmail.Value;

        await _db.SaveChangesAsync();
        return Ok(ToProfile(user));
    }

    [Authorize]
    [HttpPut("me/change-password")]
    public async Task<ActionResult<UserProfileDto>> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = _jwt.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId.Value);
        if (user == null)
            return Unauthorized(new { message = "Your session is no longer valid. Please sign in again." });

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect." });

        if (dto.NewPassword.Length < 6)
            return BadRequest(new { message = "New password must be at least 6 characters." });

        if (string.Equals(dto.NewPassword, dto.CurrentPassword, StringComparison.Ordinal))
            return BadRequest(new { message = "New password must be different from your current password." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.MustChangePassword = false;
        await _db.SaveChangesAsync();
        return Ok(ToProfile(user));
    }

    private static UserProfileDto ToProfile(User u) => new(
        u.Id, u.Email, u.DisplayName, u.MobileNumber, u.Bio, u.ProfileImageUrl,
        u.ProfileVisibility, u.ShowEmail, u.CreatedAt,
        string.IsNullOrWhiteSpace(u.Role) ? "Customer" : u.Role,
        u.MustChangePassword);
}

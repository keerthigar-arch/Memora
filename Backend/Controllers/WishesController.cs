using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Models;
using LifeEventsHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LifeEventsHub.Api.Controllers;

[ApiController]
[Route("api/events/{eventId:int}/[controller]")]
public class WishesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly FileStorageService _fileStorage;
    private readonly JwtService _jwt;

    public WishesController(AppDbContext db, FileStorageService fileStorage, JwtService jwt)
    {
        _db = db;
        _fileStorage = fileStorage;
        _jwt = jwt;
    }

    [HttpPost]
    public async Task<ActionResult<WishDto>> AddWish(int eventId, [FromBody] CreateWishDto dto)
    {
        var name = dto.SenderName?.Trim() ?? "";
        var message = dto.Message?.Trim() ?? "";
        if (name.Length is < 1 or > 150)
            return BadRequest(new { message = "Name must be between 1 and 150 characters." });
        if (message.Length is < 1 or > 2000)
            return BadRequest(new { message = "Message must be between 1 and 2000 characters." });

        var mediaUrl = string.IsNullOrWhiteSpace(dto.MediaUrl) ? null : dto.MediaUrl.Trim();
        if (mediaUrl != null && mediaUrl.Length > 500)
            return BadRequest(new { message = "That photo could not be attached." });

        var ownerId = await OwnerIfWishAllowedAsync(eventId);
        if (ownerId == null)
            return NotFound("Event not found");

        var wish = new Wish
        {
            EventId = eventId,
            SenderName = name,
            Message = message,
            MediaUrl = mediaUrl
        };

        _db.Wishes.Add(wish);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(AddWish), new { eventId, id = wish.Id }, new WishDto(wish.Id, wish.SenderName, wish.Message, wish.MediaUrl, wish.CreatedAt));
    }

    [HttpPost("upload-media")]
    public async Task<ActionResult<object>> UploadWishMedia(int eventId, IFormFile file)
    {
        var ownerId = await OwnerIfWishAllowedAsync(eventId);
        if (ownerId == null)
            return NotFound("Event not found");

        var folderUserId = ownerId.Value;
        var url = await _fileStorage.SaveFileAsync(file, folderUserId, eventId);
        if (url == null)
            return BadRequest("Invalid file. Use image types (jpg, png, gif, webp) up to 5MB.");

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        return Ok(new { Url = baseUrl + url });
    }

    /// <summary>Published, paid, in-window events. Public wishes are open; private and invite-only stay with the owner or invited guests.</summary>
    private async Task<int?> OwnerIfWishAllowedAsync(int eventId)
    {
        var now = DateTime.UtcNow;
        var ev = await _db.Events.AsNoTracking()
            .Where(e => e.Id == eventId
                && e.IsPublished
                && e.PaymentReceived
                && (e.DisplayValidityEndDate == null || e.DisplayValidityEndDate > now))
            .Select(e => new { e.Id, e.Visibility, e.UserId })
            .FirstOrDefaultAsync();
        if (ev == null)
            return null;

        if (string.Equals(ev.Visibility, "Public", StringComparison.OrdinalIgnoreCase))
            return ev.UserId ?? 0;

        var userId = _jwt.GetUserIdFromClaims(User);
        if (ev.UserId.HasValue && ev.UserId == userId)
            return ev.UserId.Value;

        if (!string.Equals(ev.Visibility, "InviteOnly", StringComparison.OrdinalIgnoreCase) || !userId.HasValue)
            return null;

        var email = _jwt.GetUserEmailFromClaims(User)?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(email))
            return null;

        var invited = await _db.EventInvites.AsNoTracking().AnyAsync(i =>
            i.EventId == ev.Id && i.InvitedEmail.Trim().ToLower() == email);
        return invited ? ev.UserId ?? 0 : null;
    }
}

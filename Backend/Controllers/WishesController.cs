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

    public WishesController(AppDbContext db, FileStorageService fileStorage)
    {
        _db = db;
        _fileStorage = fileStorage;
    }

    [HttpPost]
    public async Task<ActionResult<WishDto>> AddWish(int eventId, [FromBody] CreateWishDto dto)
    {
        var ev = await _db.Events.FindAsync(eventId);
        if (ev == null)
            return NotFound("Event not found");

        var wish = new Wish
        {
            EventId = eventId,
            SenderName = dto.SenderName,
            Message = dto.Message,
            MediaUrl = dto.MediaUrl
        };

        _db.Wishes.Add(wish);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(AddWish), new { eventId, id = wish.Id }, new WishDto(wish.Id, wish.SenderName, wish.Message, wish.MediaUrl, wish.CreatedAt));
    }

    [HttpPost("upload-media")]
    public async Task<ActionResult<object>> UploadWishMedia(int eventId, IFormFile file)
    {
        var ev = await _db.Events.FindAsync(eventId);
        if (ev == null)
            return NotFound("Event not found");

        var folderUserId = ev.UserId ?? 0;
        var url = await _fileStorage.SaveFileAsync(file, folderUserId, eventId);
        if (url == null)
            return BadRequest("Invalid file. Use image types (jpg, png, gif, webp) up to 5MB.");

        var baseUrl = _fileStorage.GetBaseUrl(Request);
        return Ok(new { Url = baseUrl + url });
    }
}

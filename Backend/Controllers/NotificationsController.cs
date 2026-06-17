using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LifeEventsHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AdminNotificationService _notifications;

    public NotificationsController(AppDbContext db, AdminNotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminNotificationDto>>> GetNotifications(
        [FromQuery] int take = 25,
        CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 50);

        await _notifications.CleanupStaleNotificationsAsync(ct);

        var rows = await _notifications.ActiveNotificationsQuery()
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .ToListAsync(ct);

        var items = await _notifications.MapToDtosAsync(rows, ct);
        return Ok(items);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<AdminNotificationUnreadCountDto>> GetUnreadCount(CancellationToken ct = default)
    {
        await _notifications.CleanupStaleNotificationsAsync(ct);

        var unread = await _notifications.ActiveNotificationsQuery()
            .CountAsync(n => !n.IsRead, ct);
        return Ok(new AdminNotificationUnreadCountDto(unread));
    }

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id, CancellationToken ct = default)
    {
        var notification = await _notifications.ActiveNotificationsQuery()
            .FirstOrDefaultAsync(n => n.Id == id, ct);
        if (notification == null) return NotFound();

        var tracked = await _db.AdminNotifications.FindAsync(new object[] { id }, ct);
        if (tracked == null) return NotFound();

        if (!tracked.IsRead)
        {
            tracked.IsRead = true;
            tracked.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }

        return NoContent();
    }
}

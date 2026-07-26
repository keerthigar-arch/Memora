using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LifeEventsHub.Api.Services;

public class AdminNotificationService
{
    private readonly AppDbContext _db;

    public AdminNotificationService(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Offline payment submitted — admin action required.</summary>
    public async Task NotifyCustomerOfflineSubmittedAsync(PendingEvent draft, CancellationToken ct = default)
    {
        if (!draft.UserId.HasValue) return;

        var customer = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == draft.UserId.Value, ct);
        if (customer == null || customer.Role != "Customer") return;

        var already = await _db.AdminNotifications
            .AnyAsync(n => n.PendingEventId == draft.Id && n.Kind == "CustomerEventOffline", ct);
        if (already) return;

        _db.AdminNotifications.Add(new AdminNotification
        {
            PendingEventId = draft.Id,
            Kind = "CustomerEventOffline",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);
    }

    /// <summary>Remove notifications once the event is published (no longer needs admin attention).</summary>
    public async Task ClearNotificationsOnPublishAsync(int? draftId, CancellationToken ct = default)
    {
        var toRemove = new List<AdminNotification>();

        if (draftId.HasValue)
        {
            var byDraft = await _db.AdminNotifications
                .Where(n => n.PendingEventId == draftId.Value)
                .ToListAsync(ct);
            toRemove.AddRange(byDraft);
        }

        if (toRemove.Count > 0)
        {
            _db.AdminNotifications.RemoveRange(toRemove);
            await _db.SaveChangesAsync(ct);
        }
    }

    /// <summary>Notifications that still need admin review (offline draft awaiting approval only).</summary>
    public IQueryable<AdminNotification> ActiveNotificationsQuery()
    {
        return _db.AdminNotifications.AsNoTracking()
            .Where(n => n.PendingEventId != null
                && n.Kind == "CustomerEventOffline"
                && _db.PendingEvents.Any(d =>
                    d.Id == n.PendingEventId
                    && d.AwaitingOfflineApproval
                    && (d.PaymentMethod == null || d.PaymentMethod == "Offline")));
    }

    /// <summary>Remove legacy rows (published events, missing drafts, old published kind).</summary>
    public async Task CleanupStaleNotificationsAsync(CancellationToken ct = default)
    {
        var stale = await _db.AdminNotifications
            .Where(n =>
                n.EventId != null
                || n.Kind == "CustomerEventPublished"
                || (n.PendingEventId != null && !_db.PendingEvents.Any(d =>
                    d.Id == n.PendingEventId
                    && d.AwaitingOfflineApproval
                    && (d.PaymentMethod == null || d.PaymentMethod == "Offline"))))
            .ToListAsync(ct);

        if (stale.Count == 0) return;

        _db.AdminNotifications.RemoveRange(stale);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<AdminNotificationDto>> MapToDtosAsync(
        IReadOnlyList<AdminNotification> rows,
        CancellationToken ct = default)
    {
        if (rows.Count == 0)
            return Array.Empty<AdminNotificationDto>();

        var pendingIds = rows.Where(n => n.PendingEventId.HasValue).Select(n => n.PendingEventId!.Value).Distinct().ToList();

        var pending = pendingIds.Count == 0
            ? new Dictionary<int, (string Title, string EventType, int? UserId, string CreatedBy)>()
            : await _db.PendingEvents.AsNoTracking()
                .Where(d => pendingIds.Contains(d.Id))
                .Select(d => new { d.Id, d.Title, d.EventType, d.UserId, d.CreatedBy })
                .ToDictionaryAsync(d => d.Id, d => (d.Title, d.EventType, d.UserId, d.CreatedBy), ct);

        var userIds = pending.Values
            .Where(d => d.UserId.HasValue)
            .Select(d => d.UserId!.Value)
            .Distinct()
            .ToList();

        var users = userIds.Count == 0
            ? new Dictionary<int, string>()
            : await _db.Users.AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.DisplayName, ct);

        static string CustomerName(int? userId, string createdBy, IReadOnlyDictionary<int, string> users)
        {
            if (userId.HasValue && users.TryGetValue(userId.Value, out var name))
                return name;
            return createdBy;
        }

        return rows.Select(n =>
        {
            var title = "Customer event";
            var eventType = "Other";
            var customerName = "Customer";

            if (n.PendingEventId.HasValue && pending.TryGetValue(n.PendingEventId.Value, out var d))
            {
                title = d.Title;
                eventType = d.EventType;
                customerName = CustomerName(d.UserId, d.CreatedBy, users);
            }

            return new AdminNotificationDto(
                n.Id,
                n.Kind,
                title,
                eventType,
                customerName,
                n.CreatedAt,
                n.EventId,
                n.PendingEventId,
                n.IsRead
            );
        }).ToList();
    }
}

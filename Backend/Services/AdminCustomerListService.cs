using LifeEventsHub.Api;
using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace LifeEventsHub.Api.Services;

public class AdminCustomerListService(AppDbContext db)
{
    public async Task<PagedResult<CustomerAdminListDto>> ListPagedAsync(
        int page,
        int pageSize,
        string? search,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, Paging.AdminMaxPageSize);

        var q = db.Users.AsNoTracking().Where(u => u.Role != "Admin");

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            q = q.Where(u =>
                u.Email.ToLower().Contains(term) ||
                u.DisplayName.ToLower().Contains(term));
        }

        var total = await q.CountAsync(cancellationToken);
        var users = await q
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var ids = users.Select(u => u.Id).ToList();
        Dictionary<int, int> eventCounts = new();
        if (ids.Count > 0)
        {
            eventCounts = await db.Events.AsNoTracking()
                .Where(e => e.UserId.HasValue && ids.Contains(e.UserId.Value))
                .GroupBy(e => e.UserId!.Value)
                .Select(g => new { UserId = g.Key, C = g.Count() })
                .ToDictionaryAsync(x => x.UserId, x => x.C, cancellationToken);
        }

        var items = users
            .Select(u => new CustomerAdminListDto(
                u.Id,
                u.Email,
                u.DisplayName,
                u.Bio,
                u.ProfileImageUrl,
                u.ProfileVisibility,
                u.ShowEmail,
                u.CreatedAt,
                eventCounts.GetValueOrDefault(u.Id, 0)))
            .ToList();

        return new PagedResult<CustomerAdminListDto>(items, total, page, pageSize);
    }

    public async Task<CustomerAdminListDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var u = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (u == null || u.Role == "Admin")
            return null;

        var eventCount = await db.Events.AsNoTracking().CountAsync(e => e.UserId == u.Id, cancellationToken);
        return new CustomerAdminListDto(
            u.Id,
            u.Email,
            u.DisplayName,
            u.Bio,
            u.ProfileImageUrl,
            u.ProfileVisibility,
            u.ShowEmail,
            u.CreatedAt,
            eventCount);
    }

    /// <summary>Deletes a customer account. Events remain with organizer user id cleared. Pending drafts are detached first.</summary>
    public async Task<(bool Ok, int Status, string? Message)> DeleteCustomerAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user == null)
            return (false, 404, "User not found.");
        if (string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase))
            return (false, 403, "Cannot delete an administrator account.");

        await db.PendingEvents
            .Where(p => p.UserId == id)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.UserId, (int?)null), cancellationToken);

        db.Users.Remove(user);
        await db.SaveChangesAsync(cancellationToken);
        return (true, 204, null);
    }
}

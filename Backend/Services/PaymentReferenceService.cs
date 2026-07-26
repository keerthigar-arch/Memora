using LifeEventsHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LifeEventsHub.Api.Services;

/// <summary>Allocates unique MEM-YYYY-XXXXXXXX payment references across pricing orders and event payments.</summary>
public class PaymentReferenceService
{
    private readonly AppDbContext _db;

    public PaymentReferenceService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<string> GenerateUniqueReferenceAsync(CancellationToken ct = default)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (var attempt = 0; attempt < 24; attempt++)
        {
            var suffixChars = new char[8];
            for (var i = 0; i < suffixChars.Length; i++)
                suffixChars[i] = chars[Random.Shared.Next(chars.Length)];
            var code = $"MEM-{DateTime.UtcNow:yyyy}-{new string(suffixChars)}";

            var exists =
                await _db.PricingOrders.AnyAsync(o => o.ReferenceCode == code, ct)
                || await _db.PendingEvents.AnyAsync(p => p.ReferenceCode == code, ct)
                || await _db.Events.AnyAsync(e => e.ReferenceCode == code, ct);

            if (!exists)
                return code;
        }

        throw new InvalidOperationException("Could not allocate payment reference.");
    }
}

using LifeEventsHub.Api;
using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Models;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace LifeEventsHub.Api.Services;

public class PricingOrderService
{
    private readonly AppDbContext _db;
    private readonly PricingService _pricing;
    private readonly StripeService _stripe;

    public PricingOrderService(AppDbContext db, PricingService pricing, StripeService stripe)
    {
        _db = db;
        _pricing = pricing;
        _stripe = stripe;
    }

    public async Task<(bool ok, string? reference, string? error)> SubmitDirectAsync(
        string category,
        string country,
        int packageColumnIndex,
        string customerName,
        string customerPhone,
        string customerEmail,
        CancellationToken ct = default)
    {
        var ve = ValidateContact(customerName, customerPhone, customerEmail);
        if (ve != null)
            return (false, null, ve);

        if (!_pricing.TryGetPublishedPlanPackage(packageColumnIndex, category, country,
                out var pkgLabel, out var amountDisp, out var wordLimit, out var amountMajor,
                out var stripeCur, out var normCat, out var catTitle))
            return (false, null, "Invalid package selection.");

        var reference = await GenerateUniqueReferenceAsync(ct);
        var order = new PricingOrder
        {
            ReferenceCode = reference,
            Status = "direct_open",
            PaymentChannel = "Direct",
            Category = normCat,
            Country = country.Trim().ToLowerInvariant(),
            PackageColumnIndex = packageColumnIndex,
            PackageDayLabel = pkgLabel,
            AmountDisplay = amountDisp,
            WordLimitDisplay = wordLimit,
            CurrencyCode = stripeCur.ToUpperInvariant(),
            CustomerName = customerName.Trim(),
            CustomerPhone = customerPhone.Trim(),
            CustomerEmail = customerEmail.Trim(),
            DirectManualPaymentReceived = false,
            CompletedAt = DateTime.UtcNow
        };
        _db.PricingOrders.Add(order);
        await _db.SaveChangesAsync(ct);
        return (true, reference, null);
    }

    public async Task<(bool ok, string? checkoutUrl, string? error)> StartCardCheckoutAsync(
        string category,
        string country,
        int packageColumnIndex,
        string customerName,
        string customerPhone,
        string customerEmail,
        CancellationToken ct = default)
    {
        var ve = ValidateContact(customerName, customerPhone, customerEmail);
        if (ve != null)
            return (false, null, ve);

        if (!_stripe.IsConfigured)
            return (false, null,
                "Card payment is not available right now. Please choose direct payment or contact us.");

        if (!_pricing.TryGetPublishedPlanPackage(packageColumnIndex, category, country,
                out var pkgLabel, out var amountDisp, out var wordLimit, out var amountMajor,
                out var stripeCur, out var normCat, out var catTitle))
            return (false, null, "Invalid package selection.");

        var order = new PricingOrder
        {
            ReferenceCode = null,
            Status = "pending_payment",
            PaymentChannel = "Card",
            Category = normCat,
            Country = country.Trim().ToLowerInvariant(),
            PackageColumnIndex = packageColumnIndex,
            PackageDayLabel = pkgLabel,
            AmountDisplay = amountDisp,
            WordLimitDisplay = wordLimit,
            CurrencyCode = stripeCur.ToUpperInvariant(),
            CustomerName = customerName.Trim(),
            CustomerPhone = customerPhone.Trim(),
            CustomerEmail = customerEmail.Trim()
        };
        _db.PricingOrders.Add(order);
        await _db.SaveChangesAsync(ct);

        try
        {
            var session = await _stripe.CreatePricingPlanCheckoutSessionAsync(
                order.Id,
                amountMajor,
                stripeCur,
                pkgLabel,
                catTitle,
                customerName.Trim(),
                customerEmail.Trim(),
                ct);

            if (string.IsNullOrEmpty(session.Url))
            {
                _db.PricingOrders.Remove(order);
                await _db.SaveChangesAsync(ct);
                return (false, null, "Stripe did not return a checkout URL. Try again later.");
            }

            order.StripeSessionId = session.Id;
            await _db.SaveChangesAsync(ct);
            return (true, session.Url, null);
        }
        catch (InvalidOperationException ex)
        {
            _db.PricingOrders.Remove(order);
            await _db.SaveChangesAsync(ct);
            return (false, null, ex.Message);
        }
        catch (Stripe.StripeException ex)
        {
            _db.PricingOrders.Remove(order);
            await _db.SaveChangesAsync(ct);
            return (false, null,
                $"Card checkout could not start: {ex.StripeError?.Message ?? ex.Message}");
        }
    }

    public Task<(bool ok, string? reference, string? error)> CompletePaidPricingOrderFromStripeAsync(
        string stripeSessionId,
        CancellationToken ct = default) =>
        CompletePaidPricingOrderFromStripeCoreAsync(stripeSessionId, ct);

    private async Task<(bool ok, string? reference, string? error)> CompletePaidPricingOrderFromStripeCoreAsync(
        string stripeSessionId,
        CancellationToken ct)
    {
        var session = await _stripe.GetSessionAsync(stripeSessionId, ct);
        if (session == null)
            return (false, null, "Payment session not found.");

        if (!string.Equals(session.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
            return (false, null, "Payment has not completed successfully. If money was debited, contact support with your receipt.");

        var pricingOrderIdStr = session.Metadata?.GetValueOrDefault("pricingOrderId");
        if (!int.TryParse(pricingOrderIdStr, out var orderId))
            return (false, null, "Invalid checkout metadata.");

        var order = await _db.PricingOrders.FirstOrDefaultAsync(o => o.Id == orderId, ct);
        if (order == null)
            return (false, null, "Order not found.");

        if (!string.IsNullOrEmpty(order.ReferenceCode))
            return (true, order.ReferenceCode, null);

        if (order.Status != "pending_payment")
            return (false, null, "This order cannot be completed.");

        order.ReferenceCode = await GenerateUniqueReferenceAsync(ct);
        order.Status = "paid_card";
        order.CompletedAt = DateTime.UtcNow;
        order.StripeSessionId = session.Id;
        order.StripePaymentIntentId = session.PaymentIntentId;
        order.PaidAmountMinorUnits = session.AmountTotal;
        order.PaidCurrencyCode = string.IsNullOrEmpty(session.Currency)
            ? null
            : session.Currency.ToUpperInvariant();
        await _db.SaveChangesAsync(ct);
        return (true, order.ReferenceCode, null);
    }

    /// <summary>Admin list with server-side filters and paging (default 20 per page).</summary>
    public async Task<PagedResult<PricingOrderAdminDto>> GetPagedForAdminAsync(
        int page,
        int pageSize,
        string? paymentChannel,
        string? status,
        string? search,
        string? category,
        string? country,
        DateTime? dateFrom,
        DateTime? dateTo,
        bool? directManualReceived,
        CancellationToken ct = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize switch
        {
            < 1 => 20,
            _ => Math.Clamp(pageSize, 1, Paging.AdminMaxPageSize)
        };

        var q = _db.PricingOrders.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(paymentChannel))
        {
            var ch = paymentChannel.Trim();
            if (string.Equals(ch, "direct", StringComparison.OrdinalIgnoreCase))
                q = q.Where(o => o.PaymentChannel == "Direct");
            else if (string.Equals(ch, "card", StringComparison.OrdinalIgnoreCase))
                q = q.Where(o => o.PaymentChannel == "Card");
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var st = status.Trim();
            q = q.Where(o => o.Status == st);
        }

        if (directManualReceived.HasValue)
            q = q.Where(o =>
                o.PaymentChannel == "Direct" &&
                o.DirectManualPaymentReceived == directManualReceived.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(o =>
                (o.ReferenceCode != null && o.ReferenceCode.Contains(s)) ||
                o.CustomerName.Contains(s) ||
                o.CustomerEmail.Contains(s) ||
                o.CustomerPhone.Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            var c = category.Trim();
            q = q.Where(o => o.Category.Contains(c));
        }

        if (!string.IsNullOrWhiteSpace(country))
        {
            var co = country.Trim();
            q = q.Where(o => o.Country.Contains(co));
        }

        if (dateFrom.HasValue)
            q = q.Where(o => o.CreatedAt >= dateFrom.Value);

        if (dateTo.HasValue)
        {
            var endExclusive = dateTo.Value.Date.AddDays(1);
            q = q.Where(o => o.CreatedAt < endExclusive);
        }

        var total = await q.CountAsync(ct);

        var items = await q
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new PricingOrderAdminDto(
                o.Id,
                o.ReferenceCode,
                o.Status,
                o.PaymentChannel,
                o.Category,
                o.Country,
                o.PackageDayLabel,
                o.AmountDisplay,
                o.CurrencyCode,
                o.CustomerName,
                o.CustomerPhone,
                o.CustomerEmail,
                o.StripeSessionId,
                o.StripePaymentIntentId,
                o.PaidAmountMinorUnits,
                o.PaidCurrencyCode,
                o.DirectManualPaymentReceived,
                o.DirectManualPaymentMarkedAt,
                o.CreatedAt,
                o.CompletedAt))
            .ToListAsync(ct);

        return new PagedResult<PricingOrderAdminDto>(items, total, page, pageSize);
    }

    public async Task<(bool ok, string? error)> SetDirectManualPaymentReceivedAsync(
        int orderId,
        bool received,
        CancellationToken ct = default)
    {
        var order = await _db.PricingOrders.FindAsync(new object[] { orderId }, ct);
        if (order == null)
            return (false, "Order not found.");

        if (!order.PaymentChannel.Equals("Direct", StringComparison.OrdinalIgnoreCase))
            return (false, "Manual payment flag applies only to direct (bank transfer) orders.");

        order.DirectManualPaymentReceived = received;
        order.DirectManualPaymentMarkedAt = received ? DateTime.UtcNow : null;
        await _db.SaveChangesAsync(ct);
        return (true, null);
    }

    private static string? ValidateContact(string name, string phone, string email)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length < 2)
            return "Please enter your full name.";
        if (string.IsNullOrWhiteSpace(phone) || phone.Trim().Length < 6)
            return "Please enter a valid phone number.";
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@', StringComparison.Ordinal))
            return "Please enter a valid email address.";
        return null;
    }

    private async Task<string> GenerateUniqueReferenceAsync(CancellationToken ct)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (var attempt = 0; attempt < 24; attempt++)
        {
            var suffixChars = new char[8];
            for (var i = 0; i < suffixChars.Length; i++)
                suffixChars[i] = chars[Random.Shared.Next(chars.Length)];
            var code = $"MEM-{DateTime.UtcNow:yyyy}-{new string(suffixChars)}";
            var exists = await _db.PricingOrders.AnyAsync(o => o.ReferenceCode == code, ct);
            if (!exists)
                return code;
        }

        throw new InvalidOperationException("Could not allocate order reference.");
    }
}

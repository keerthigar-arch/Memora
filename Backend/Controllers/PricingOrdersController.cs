using LifeEventsHub.Api;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeEventsHub.Api.Controllers;

/// <summary>
/// Public pricing checkout + admin payment list. Route must stay <c>api/pricing-orders</c> (kebab-case)
/// so Angular apps calling <c>/api/pricing-orders/...</c> resolve; <c>[controller]</c> would emit <c>PricingOrders</c>.
/// </summary>
[ApiController]
[Route("api/pricing-orders")]
public class PricingOrdersController : ControllerBase
{
    private readonly PricingOrderService _orders;

    public PricingOrdersController(PricingOrderService orders)
    {
        _orders = orders;
    }

    /// <summary>List pricing-package orders with filters and paging — Admin only (default 20 per page).</summary>
    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<PricingOrderAdminDto>>> AdminListPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? paymentChannel = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] string? country = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] bool? directManualReceived = null,
        CancellationToken ct = default)
    {
        (page, pageSize) = Paging.Normalize(page, pageSize, defaultPageSize: 20, maxPageSize: Paging.AdminMaxPageSize);

        var result = await _orders.GetPagedForAdminAsync(
            page,
            pageSize,
            paymentChannel,
            status,
            search,
            category,
            country,
            dateFrom,
            dateTo,
            directManualReceived,
            ct);
        return Ok(result);
    }

    /// <summary>Mark whether manual/direct payment was received (bank transfer orders).</summary>
    [HttpPatch("admin/{id:int}/direct-payment-received")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SetDirectManualPaid(
        int id,
        [FromBody] DirectManualPaymentReceivedBody body,
        CancellationToken ct)
    {
        var (ok, error) = await _orders.SetDirectManualPaymentReceivedAsync(id, body.Received, ct);
        if (!ok)
            return BadRequest(new { message = error });
        return Ok(new { received = body.Received });
    }

    [HttpPost("direct")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitDirect([FromBody] PricingOrderContactRequest request, CancellationToken ct)
    {
        var (ok, reference, error) = await _orders.SubmitDirectAsync(
            request.Category ?? "",
            request.Country ?? "",
            request.PackageColumnIndex,
            request.CustomerName ?? "",
            request.CustomerPhone ?? "",
            request.CustomerEmail ?? "",
            ct);

        if (!ok)
            return BadRequest(new { message = error });

        return Ok(new { reference });
    }

    [HttpPost("card/checkout-session")]
    [AllowAnonymous]
    public async Task<IActionResult> StartCardCheckout([FromBody] PricingOrderContactRequest request, CancellationToken ct)
    {
        var (ok, url, error) = await _orders.StartCardCheckoutAsync(
            request.Category ?? "",
            request.Country ?? "",
            request.PackageColumnIndex,
            request.CustomerName ?? "",
            request.CustomerPhone ?? "",
            request.CustomerEmail ?? "",
            ct);

        if (!ok)
            return BadRequest(new { message = error });

        return Ok(new { url });
    }

    [HttpPost("card/verify-session")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyCardSession([FromBody] VerifyPricingCheckoutRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.SessionId))
            return BadRequest(new { message = "Session ID is required." });

        var (ok, reference, error) =
            await _orders.CompletePaidPricingOrderFromStripeAsync(request.SessionId.Trim(), ct);

        if (!ok)
            return BadRequest(new { message = error });

        return Ok(new { reference });
    }
}

public record PricingOrderContactRequest(
    string Category,
    string Country,
    int PackageColumnIndex,
    string CustomerName,
    string CustomerPhone,
    string CustomerEmail);

public record VerifyPricingCheckoutRequest(string SessionId);

public class DirectManualPaymentReceivedBody
{
    public bool Received { get; set; }
}

using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeEventsHub.Api.Controllers;

/// <summary>Admin-only customer user APIs (separate route prefix so proxies and deployments pick up routes clearly).</summary>
[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly AdminCustomerListService _customers;

    public AdminUsersController(AdminCustomerListService customers)
    {
        _customers = customers;
    }

    /// <summary>Paged list of customer accounts (excludes Admin role). Search matches email or display name.</summary>
    [HttpGet("customers")]
    public async Task<ActionResult<PagedResult<CustomerAdminListDto>>> ListCustomers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _customers.ListPagedAsync(page, pageSize, search, cancellationToken);
        return Ok(result);
    }

    /// <summary>Single customer by id (404 if missing or user is Admin).</summary>
    [HttpGet("customers/{id:int}")]
    public async Task<ActionResult<CustomerAdminListDto>> GetCustomer(int id, CancellationToken cancellationToken)
    {
        var row = await _customers.GetByIdAsync(id, cancellationToken);
        return row == null ? NotFound() : Ok(row);
    }

    /// <summary>Permanently delete a customer profile (not admin accounts). Events remain with organizer unset.</summary>
    [HttpDelete("customers/{id:int}")]
    public async Task<IActionResult> DeleteCustomer(int id, CancellationToken cancellationToken)
    {
        var (ok, status, message) = await _customers.DeleteCustomerAsync(id, cancellationToken);
        if (!ok)
            return StatusCode(status, new { message });

        return NoContent();
    }
}

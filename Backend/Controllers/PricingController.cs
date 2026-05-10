using LifeEventsHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeEventsHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class PricingController : ControllerBase
{
    private readonly PricingService _pricing;

    public PricingController(PricingService pricing)
    {
        _pricing = pricing;
    }

    [HttpGet("plans")]
    public IActionResult GetPlans([FromQuery] string? category = "obituary", [FromQuery] string? country = "srilanka")
    {
        var payload = _pricing.GetPricingPage(category, country);
        return Ok(payload);
    }
}

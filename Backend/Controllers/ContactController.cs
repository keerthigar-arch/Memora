using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace LifeEventsHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly AppDbContext _db;

    public ContactController(AppDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] ContactSubmitDto dto)
    {
        var submission = new ContactSubmission
        {
            Name = dto.Name,
            Email = dto.Email,
            Subject = dto.Subject,
            Message = dto.Message
        };

        _db.ContactSubmissions.Add(submission);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Thank you for your message. We will get back to you soon." });
    }
}

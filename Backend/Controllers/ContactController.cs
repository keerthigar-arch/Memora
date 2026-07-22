using LifeEventsHub.Api.Data;
using LifeEventsHub.Api.DTOs;
using LifeEventsHub.Api.Models;
using LifeEventsHub.Api.Services;
using LifeEventsHub.Api.Templates;
using Microsoft.AspNetCore.Mvc;

namespace LifeEventsHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;
    private readonly ILogger<ContactController> _logger;

    public ContactController(
        AppDbContext db,
        IEmailService email,
        IConfiguration config,
        ILogger<ContactController> logger)
    {
        _db = db;
        _email = email;
        _config = config;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] ContactSubmitDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { message = "Name, email, and message are required." });

        var submission = new ContactSubmission
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.Trim(),
            Subject = dto.Subject?.Trim() ?? "",
            Message = dto.Message.Trim()
        };

        _db.ContactSubmissions.Add(submission);
        await _db.SaveChangesAsync(cancellationToken);

        var supportTo = _config["Smtp:SupportTo"]?.Trim()
            ?? _config["Smtp:From"]?.Trim()
            ?? _config["Smtp:User"]?.Trim();

        if (!string.IsNullOrEmpty(supportTo))
        {
            try
            {
                var supportHtml = ContactSubmissionEmailTemplate.BuildForSupport(
                    submission.Name, submission.Email, submission.Subject, submission.Message);
                var supportSubject = string.IsNullOrWhiteSpace(submission.Subject)
                    ? $"Contact form: {submission.Name}"
                    : $"Contact: {submission.Subject}";
                await _email.SendHtmlEmailAsync(
                    supportTo,
                    supportSubject,
                    supportHtml,
                    cancellationToken,
                    replyToAddress: submission.Email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to email support about contact submission {Id}", submission.Id);
            }
        }

        try
        {
            var confirmHtml = ContactSubmissionEmailTemplate.BuildConfirmation(submission.Name);
            await _email.SendHtmlEmailAsync(
                submission.Email,
                "We received your message — Memora",
                confirmHtml,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send contact confirmation to {Email}", submission.Email);
        }

        return Ok(new { message = "Thank you for your message. We will get back to you soon." });
    }
}

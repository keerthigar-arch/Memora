using System.ComponentModel.DataAnnotations;

namespace LifeEventsHub.Api.DTOs;

public record ContactSubmitDto(
    [Required][MaxLength(150)] string Name,
    [Required][EmailAddress][MaxLength(200)] string Email,
    [MaxLength(200)] string? Subject,
    [Required] string Message
);

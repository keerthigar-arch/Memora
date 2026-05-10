namespace LifeEventsHub.Api.DTOs;

public record WishDto(int Id, string SenderName, string Message, string? MediaUrl, DateTime CreatedAt);

public record CreateWishDto(string SenderName, string Message, string? MediaUrl = null);

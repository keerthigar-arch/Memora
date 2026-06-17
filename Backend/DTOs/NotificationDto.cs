namespace LifeEventsHub.Api.DTOs;

/// <summary>API response — display fields are joined from Events/PendingEvents, not stored on AdminNotifications.</summary>
public record AdminNotificationDto(
    int Id,
    string Kind,
    string Title,
    string EventType,
    string CustomerDisplayName,
    DateTime CreatedAt,
    int? EventId,
    int? PendingEventId,
    bool IsRead
);

public record AdminNotificationUnreadCountDto(int UnreadCount);

namespace LifeEventsHub.Api.DTOs;

public record EventListDto(
    int Id,
    string Title,
    string Description,
    string EventType,
    DateTime EventDate,
    DateTime? BirthDate,
    DateTime? DeathDate,
    DateTime? WeddingDate,
    string? Location,
    string? Country,
    string? MainImageUrl,
    string CreatedBy,
    DateTime CreatedAt,
    int WishCount,
    string Visibility
);

/// <summary>Organizer list: includes hidden/unpublished events.</summary>
public record AdminEventListDto(
    int Id,
    string Title,
    string Description,
    string EventType,
    DateTime EventDate,
    DateTime? BirthDate,
    DateTime? DeathDate,
    DateTime? WeddingDate,
    string? Location,
    string? Country,
    string? MainImageUrl,
    string CreatedBy,
    DateTime CreatedAt,
    int WishCount,
    string Visibility,
    bool IsPublished,
    DateTime? DisplayValidityEndDate,
    bool PaymentReceived,
    string OwnerRole = "Customer",
    string? OwnerDisplayName = null
);

public record EventManageStatsDto(int AdminCount, int CustomerCount);

public record SetPublishedDto(bool Published);

public record AdminPaymentEventDto(
    int Id,
    string Title,
    string EventType,
    DateTime EventDate,
    int DisplayDays,
    decimal AmountDue,
    DateTime CreatedAt,
    string? MainImageUrl
);

public record EventDetailDto(
    int Id,
    string Title,
    string Description,
    string EventType,
    DateTime EventDate,
    DateTime? BirthDate,
    DateTime? DeathDate,
    DateTime? WeddingDate,
    string? Location,
    string? Country,
    string? MainImageUrl,
    string? GalleryUrls,
    string? VideoUrls,
    string CreatedBy,
    DateTime CreatedAt,
    List<WishDto> Wishes,
    string Visibility,
    bool PaymentReceived,
    bool IsOwner = false,
    List<string>? InvitedEmails = null
);

public record EventInviteDto(int Id, string InvitedEmail, DateTime CreatedAt);

public record CreateEventDto(
    string Title,
    string Description,
    string EventType,
    DateTime EventDate,
    string? Location,
    string CreatedBy
);

public record CustomerDraftListDto(
    int Id,
    string Title,
    string EventType,
    DateTime EventDate,
    int DisplayDays,
    decimal AmountPaid,
    bool AwaitingOfflineApproval,
    bool PaymentReceived,
    string? PaymentMethod,
    DateTime CreatedAt,
    string? MainImageUrl,
    DateTime? OfflineSubmittedAt = null,
    string? OwnerDisplayName = null,
    string? OwnerEmail = null,
    string? ReferenceCode = null
);

/// <summary>Published customer event payment (card or offline) for the admin Payments page.</summary>
public record CustomerPaidEventDto(
    int Id,
    string Title,
    string EventType,
    DateTime EventDate,
    int DisplayDays,
    decimal AmountPaid,
    string PaymentMethod,
    DateTime PaidAt,
    string? MainImageUrl,
    string? OwnerDisplayName,
    string? OwnerEmail,
    string? ReferenceCode = null
);

public record CustomerDraftDetailDto(
    int Id,
    string Title,
    string Description,
    string EventType,
    DateTime EventDate,
    DateTime? BirthDate,
    DateTime? DeathDate,
    DateTime? WeddingDate,
    string? Location,
    string? Country,
    string? MainImageUrl,
    string? GalleryUrlsJson,
    string? VideoUrlsJson,
    string CreatedBy,
    string Visibility,
    int DisplayDays,
    decimal AmountPaid,
    bool AwaitingOfflineApproval,
    bool PaymentReceived,
    string? PaymentMethod,
    DateTime CreatedAt,
    DateTime? OfflineSubmittedAt,
    string? OwnerDisplayName,
    string? OwnerEmail,
    string? InvitedEmails = null,
    string? ConfirmationDocumentUrl = null,
    string? ReferenceCode = null
);

public record RecentWishSidebarDto(
    int Id,
    string SenderName,
    string MessagePreview,
    DateTime CreatedAt,
    int EventId,
    string EventTitle,
    string? EventImageUrl
);

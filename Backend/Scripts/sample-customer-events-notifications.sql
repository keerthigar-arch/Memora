-- =============================================================================
-- Memora Admin — sample customer events + notifications (MySQL)
-- Database: lifeeventshub
--
-- AdminNotifications stores REFERENCES ONLY (EventId / PendingEventId, Kind, IsRead).
-- Title, type, customer name come from Events / PendingEvents / Users at runtime.
--
-- After running:
--   • Bell badge: 2 unread (offline drafts awaiting approval only)
--   • Published customer events do NOT appear in notifications
--   • Click notification → /pending-event/{draftId}
-- =============================================================================

USE lifeeventshub;

SET @demo_password_hash = '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- 1) Demo customers
INSERT INTO `Users` (
  `Email`, `UserName`, `PasswordHash`, `DisplayName`, `ProfileVisibility`,
  `ShowEmail`, `CreatedAt`, `Role`, `MustChangePassword`
)
SELECT
  'priya.customer@example.com', NULL, @demo_password_hash, 'Priya Nair', 'Public',
  0, UTC_TIMESTAMP(6), 'Customer', 0
WHERE NOT EXISTS (SELECT 1 FROM `Users` WHERE `Email` = 'priya.customer@example.com');

INSERT INTO `Users` (
  `Email`, `UserName`, `PasswordHash`, `DisplayName`, `ProfileVisibility`,
  `ShowEmail`, `CreatedAt`, `Role`, `MustChangePassword`
)
SELECT
  'james.customer@example.com', NULL, @demo_password_hash, 'James Carter', 'Public',
  0, UTC_TIMESTAMP(6), 'Customer', 0
WHERE NOT EXISTS (SELECT 1 FROM `Users` WHERE `Email` = 'james.customer@example.com');

SET @priya_id = (SELECT `Id` FROM `Users` WHERE `Email` = 'priya.customer@example.com' LIMIT 1);
SET @james_id = (SELECT `Id` FROM `Users` WHERE `Email` = 'james.customer@example.com' LIMIT 1);

-- 2) Published customer events
INSERT INTO `Events` (
  `Title`, `Description`, `EventType`, `EventDate`, `Location`, `Country`,
  `CurrencyCode`, `AmountGBP`, `AmountPaid`, `ExchangeRateUsed`,
  `MainImageUrl`, `CreatedBy`, `UserId`, `CreatedAt`,
  `IsPublished`, `Visibility`, `DisplayDays`, `DisplayValidityEndDate`, `PaymentReceived`
)
SELECT
  'Aanya''s 8th Birthday — Priya (demo)',
  'Customer-created demo event.',
  'Birthday',
  DATE_ADD(CURDATE(), INTERVAL 14 DAY),
  'Colombo', 'Sri Lanka',
  'USD', 0, 200.0000, 1.000000,
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
  'Priya Nair', @priya_id, DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 2 HOUR),
  1, 'Public', 30, DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 30 DAY), 1
WHERE NOT EXISTS (SELECT 1 FROM `Events` WHERE `Title` = 'Aanya''s 8th Birthday — Priya (demo)');

INSERT INTO `Events` (
  `Title`, `Description`, `EventType`, `EventDate`, `WeddingDate`, `Location`, `Country`,
  `CurrencyCode`, `AmountGBP`, `AmountPaid`, `ExchangeRateUsed`,
  `MainImageUrl`, `CreatedBy`, `UserId`, `CreatedAt`,
  `IsPublished`, `Visibility`, `DisplayDays`, `DisplayValidityEndDate`, `PaymentReceived`
)
SELECT
  'James & Elena — 10th Anniversary (demo)',
  'Customer-created demo event.',
  'Anniversary',
  DATE_ADD(CURDATE(), INTERVAL 30 DAY),
  DATE_SUB(CURDATE(), INTERVAL 3650 DAY),
  'London', 'United Kingdom',
  'USD', 0, 350.0000, 1.000000,
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
  'James Carter', @james_id, DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 90 MINUTE),
  1, 'Public', 90, DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 90 DAY), 1
WHERE NOT EXISTS (SELECT 1 FROM `Events` WHERE `Title` = 'James & Elena — 10th Anniversary (demo)');

INSERT INTO `Events` (
  `Title`, `Description`, `EventType`, `EventDate`, `BirthDate`, `DeathDate`, `Location`, `Country`,
  `CurrencyCode`, `AmountGBP`, `AmountPaid`, `ExchangeRateUsed`,
  `MainImageUrl`, `CreatedBy`, `UserId`, `CreatedAt`,
  `IsPublished`, `Visibility`, `DisplayDays`, `DisplayValidityEndDate`, `PaymentReceived`
)
SELECT
  'In Loving Memory of Mr. Silva — Priya (demo)',
  'Customer-created remembrance event.',
  'Remembrance',
  DATE_SUB(CURDATE(), INTERVAL 7 DAY),
  DATE_SUB(CURDATE(), INTERVAL 25550 DAY),
  DATE_SUB(CURDATE(), INTERVAL 30 DAY),
  'Kandy', 'Sri Lanka',
  'USD', 0, 500.0000, 1.000000,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  'Priya Nair', @priya_id, DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 45 MINUTE),
  1, 'Public', 180, DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 180 DAY), 1
WHERE NOT EXISTS (SELECT 1 FROM `Events` WHERE `Title` = 'In Loving Memory of Mr. Silva — Priya (demo)');

SET @event_birthday_id    = (SELECT `Id` FROM `Events` WHERE `Title` = 'Aanya''s 8th Birthday — Priya (demo)' LIMIT 1);
SET @event_anniversary_id = (SELECT `Id` FROM `Events` WHERE `Title` = 'James & Elena — 10th Anniversary (demo)' LIMIT 1);
SET @event_remembrance_id = (SELECT `Id` FROM `Events` WHERE `Title` = 'In Loving Memory of Mr. Silva — Priya (demo)' LIMIT 1);

-- 3) Offline drafts
INSERT INTO `PendingEvents` (
  `UserId`, `Title`, `Description`, `EventType`, `EventDate`, `Location`, `Country`,
  `MainImagePath`, `CreatedBy`, `Visibility`, `DisplayDays`, `AmountPaid`,
  `PaymentReceived`, `AwaitingOfflineApproval`, `OfflineSubmittedAt`, `PaymentMethod`, `CreatedAt`
)
SELECT
  @james_id,
  'Baby Noah''s Naming Day — offline demo',
  'Offline payment draft for notification testing.',
  'Other',
  DATE_ADD(CURDATE(), INTERVAL 21 DAY),
  'Manchester', 'United Kingdom',
  'https://images.unsplash.com/photo-1515488042361-ee00e8170cb6?w=800',
  'James Carter', 'Public', 30, 200.0000,
  0, 1, DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 20 MINUTE), 'Offline',
  DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 25 MINUTE)
WHERE NOT EXISTS (SELECT 1 FROM `PendingEvents` WHERE `Title` = 'Baby Noah''s Naming Day — offline demo');

INSERT INTO `PendingEvents` (
  `UserId`, `Title`, `Description`, `EventType`, `EventDate`, `Location`, `Country`,
  `MainImagePath`, `CreatedBy`, `Visibility`, `DisplayDays`, `AmountPaid`,
  `PaymentReceived`, `AwaitingOfflineApproval`, `OfflineSubmittedAt`, `PaymentMethod`, `CreatedAt`
)
SELECT
  @priya_id,
  'Rohan & Meera Wedding — offline demo',
  'Offline payment draft for notification testing.',
  'Wedding',
  DATE_ADD(CURDATE(), INTERVAL 60 DAY),
  'Colombo', 'Sri Lanka',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
  'Priya Nair', 'Public', 90, 350.0000,
  0, 1, DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 10 MINUTE), 'Offline',
  DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 15 MINUTE)
WHERE NOT EXISTS (SELECT 1 FROM `PendingEvents` WHERE `Title` = 'Rohan & Meera Wedding — offline demo');

SET @draft_naming_id  = (SELECT `Id` FROM `PendingEvents` WHERE `Title` = 'Baby Noah''s Naming Day — offline demo' LIMIT 1);
SET @draft_wedding_id = (SELECT `Id` FROM `PendingEvents` WHERE `Title` = 'Rohan & Meera Wedding — offline demo' LIMIT 1);

-- 4) Notifications — offline drafts only (removed once event is published)
INSERT INTO `AdminNotifications` (`EventId`, `PendingEventId`, `Kind`, `IsRead`, `ReadAt`, `CreatedAt`)
SELECT NULL, @draft_naming_id, 'CustomerEventOffline', 0, NULL, DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 20 MINUTE)
WHERE @draft_naming_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `AdminNotifications` WHERE `PendingEventId` = @draft_naming_id AND `Kind` = 'CustomerEventOffline'
  );

INSERT INTO `AdminNotifications` (`EventId`, `PendingEventId`, `Kind`, `IsRead`, `ReadAt`, `CreatedAt`)
SELECT NULL, @draft_wedding_id, 'CustomerEventOffline', 0, NULL, DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 10 MINUTE)
WHERE @draft_wedding_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `AdminNotifications` WHERE `PendingEventId` = @draft_wedding_id AND `Kind` = 'CustomerEventOffline'
  );

SELECT
  (SELECT COUNT(*) FROM `AdminNotifications` n
   INNER JOIN `PendingEvents` d ON d.`Id` = n.`PendingEventId`
   WHERE d.`AwaitingOfflineApproval` = 1 AND n.`Kind` = 'CustomerEventOffline') AS active_notifications,
  (SELECT COUNT(*) FROM `AdminNotifications` n
   INNER JOIN `PendingEvents` d ON d.`Id` = n.`PendingEventId`
   WHERE d.`AwaitingOfflineApproval` = 1 AND n.`Kind` = 'CustomerEventOffline' AND n.`IsRead` = 0) AS unread_count;

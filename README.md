# Life Events Memory Keeper

A web application for recording, preserving, and sharing memories related to key life events: **Birthday Wishes**, **Wedding Anniversaries**, and **Obituaries & Memorials**.

## Event Types

- **Birthday Wishes** — Post messages, photos, and videos celebrating birthdays
- **Wedding Anniversaries** — Document anniversaries over time, share wedding photos, receive congratulatory messages
- **Obituaries & Memorials** — Publish obituaries, funeral details, tributes, and condolences

## Features

- **User Account Management**: Registration, login, profile management, privacy settings, change password
- Create, edit, and delete events (requires login; only owners can edit/delete their events)
- **Invite-based sharing (Option C)**: Public, Private, or Invite Only — creator invites specific people by email; invited users must log in with that email to view
- Search & filter events
- Post wishes/tributes with optional photo attachments
- Different UI tone for celebratory vs. memorial events

## Database schema

If you have an existing database, drop it to apply the latest schema (EventInvites, WeddingDate, Visibility, MediaUrl):

```sql
DROP DATABASE lifeeventshub;
```

Then run the app again—it will recreate the database and seed sample data.

**Test account** (created on first run if no users exist):
- Email: `test@example.com`
- Password: `password123`

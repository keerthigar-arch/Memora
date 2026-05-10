# Front-end applications

This repository has **two separate Angular projects**:

| Folder | Role | Dev URL | Port |
|--------|------|---------|------|
| `Frontend-Customer` | Public feed, event pages, wishes, contact, login/register | http://localhost:4200 | 4200 |
| `Frontend-Admin` | Organizers: create event, payment, profile, edit event | http://localhost:4201 | 4201 |

Each app has its own `package.json` and `node_modules`. Run `npm install` inside each folder before `npm start`.

**Backend** (`Backend/`) must allow both origins — `Program.cs` includes CORS for ports 4200 and 4201.

**Cross-links** use `src/environments/environment.ts` in each app (`customerPortalUrl`, `adminPortalUrl`). Adjust for production.

**Stripe checkout** success/cancel URLs default to the organizer app (`Frontend:BaseUrl` in API config, default `http://localhost:4201`).

The legacy `Frontend/` folder (if still present) is superseded by these two projects.

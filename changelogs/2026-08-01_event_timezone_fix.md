# Event Timezone Fix (Kyiv UTC+3)

### a) Як було до редагування
When an admin entered an event time in the form (e.g. 12:00 Kyiv), the `datetime-local` input produced a timezone-naive string (`2026-09-01T12:00`). PostgreSQL interpreted this as UTC, so it was stored as `12:00:00+00`. When the public site rendered it with `date-fns format()`, the browser converted UTC to Kyiv local time (+3 hours), displaying `15:00` instead of the intended `12:00`. The existing event (SUMMER DARK BEACH) was off by 3 hours.

### b) Які зміни було внесено та їх цінність
- Added two helper functions in `src/lib/utils.ts`:
  - `localToUtcIso()` — converts a naive `datetime-local` string (interpreted as browser local time, which is Kyiv for the admin) into a proper ISO-8601 UTC string before sending to the database.
  - `utcToLocalInput()` — converts an ISO-8601 UTC timestamp back into a `YYYY-MM-DDTHH:mm` string in Kyiv timezone for display in the edit form, so the admin sees the time they originally entered.
- Updated `src/pages/admin/events.tsx`:
  - On save: the date is now converted to UTC before upsert.
  - On edit: the stored UTC date is converted back to Kyiv local time for the form field.
  - Removed the old `.slice(0, 16)` hack that assumed the stored value was already a naive local string.
- Corrected the one existing event row in the database by shifting its date -3 hours, compensating for the previous incorrect storage.

### c) Як стало після редагування
The admin now enters a time in Kyiv local time, it is stored correctly as UTC, and both the admin edit form and the public events section display the intended Kyiv time. The 3-hour offset is eliminated. The existing SUMMER DARK BEACH event now shows its original intended time.

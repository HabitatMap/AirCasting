# API Endpoints used by mobile apps

**Base URL:** `http://aircasting.org` (configurable via Settings in both apps)

> **Note:** `/users/password.json` is the only endpoint without the `/api/` prefix.
> **Note:** iOS `AirCastingSessionUploadService` hardcodes `http://aircasting.org/api/sessions`, bypassing the configurable base URL.

| Method | Endpoint | Description | iOS | Android |
|--------|----------|-------------|:---:|:-------:|
| DELETE | `/api/fixed/threshold_alerts/{id}` | Delete a threshold alert | ✓ | ✓ |
| GET | `/api/fixed/active/sessions.json` | Get active fixed sessions in a bounding box | ✓ | ✓ |
| GET | `/api/fixed/sessions/{id}.json` | Get a stream for a specific fixed session | — | ✓ |
| GET | `/api/fixed/sessions/{id}/streams.json` | Get all streams (and measurements) for a fixed session | ✓ | ✓ |
| GET | `/api/fixed/streams/{id}.json` | Get a single stream with measurements | ✓ | — |
| GET | `/api/fixed/threshold_alerts` | Fetch all threshold alerts | ✓ | ✓ |
| GET | `/api/realtime/sync_measurements.json` | Fetch new measurements since a timestamp | ✓ | ✓ |
| GET | `/api/sessions/export_by_uuid.json` | Export / share session via email | ✓ | ✓ |
| GET | `/api/user.json` | Sign in (HTTP Basic Auth) | ✓ | ✓ |
| GET | `/api/user/sessions/empty.json` | Download session metadata (without measurements) | ✓ | ✓ |
| GET | `/api/user/sessions/empty.json?stream_measurements=true` | Download full session with measurements | ✓ | ✓ |
| POST | `/api/fixed/threshold_alerts` | Create a threshold alert | ✓ | ✓ |
| POST | `/api/realtime/measurements` | Upload fixed measurements (gzip + base64) | ✓ | ✓ |
| POST | `/api/realtime/sessions.json` | Create a new fixed WiFi session | ✓ | ✓ |
| POST | `/api/sessions` | Upload / create a mobile session | ✓ | ✓ |
| POST | `/api/user.json` | Sign up — create new account | ✓ | ✓ |
| POST | `/api/user/delete_account_confirm` | Confirm account deletion with code | ✓ | ✓ |
| POST | `/api/user/delete_account_send_code` | Initiate account deletion (sends email code) | ✓ | ✓ |
| POST | `/api/user/sessions/sync_with_versioning.json` | Sync sessions (get diff of what to upload/download) | ✓ | ✓ |
| POST | `/api/user/sessions/update_session.json` | Update an existing session | — | ✓ |
| POST | `/api/user/settings` | Update user settings | ✓ | ✓ |
| POST | `/users/password.json` | Forgot password — send reset email | ✓ | ✓ |

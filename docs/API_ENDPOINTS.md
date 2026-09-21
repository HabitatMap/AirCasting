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

## v3 endpoints, not yet called by a shipped client

The table above lists what the released iOS and Android builds call. The v3
mobile-session API is finished and documented but no shipped client uses it
yet, so it has no column here — it gets rows once a build calls it.

**Time convention for this group.** Every timestamp on the wire is a *real UTC
instant* — epoch milliseconds in JSON, epoch seconds inside the binary upload
frames. Nothing is local time. The session carries `time_zone` (IANA) so a client
can render those instants as the local time the session was recorded in. The
`sessions.*_local` columns behind them hold local wall clock in a naive UTC
column; that is storage, and it stops at the serializer.

This differs deliberately from the web graph endpoints (`/api/v3/fixed_measurements`,
`/api/v3/station_measurements`), which send and return *local-as-UTC* epoch ms so
Highcharts can plot with `useUTC: true`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v3/mobile_sessions` | Create a mobile session and its streams |
| GET | `/api/v3/mobile_sessions` | List the caller's mobile sessions — paginated, `{ sessions, meta }`; no notes |
| GET | `/api/v3/mobile_sessions/{uuid}` | One session with stream metadata and notes, no measurements |
| PATCH | `/api/v3/mobile_sessions/{uuid}` | Update title and tags. No PUT; never touches notes, streams or the device |
| DELETE | `/api/v3/mobile_sessions/{uuid}` | Delete a session and record a tombstone. Safe to retry — an already-deleted uuid answers 204, not 404 |
| GET | `/api/v3/mobile_sessions/{uuid}/notes` | The session's notes, ordered by `number` then `id` |
| POST | `/api/v3/mobile_sessions/{uuid}/notes` | Add one note (optional base64 photo); `number` is server-allocated |
| PATCH | `/api/v3/mobile_sessions/{uuid}/notes/{id}` | Edit a note's text and/or photo. No PUT. `photo: null` removes the photo |
| DELETE | `/api/v3/mobile_sessions/{uuid}/notes/{id}` | Delete a note and its photo; remaining numbers keep their gaps |
| GET | `/api/v3/mobile_sessions/{uuid}/measurements` | Measurements for one stream — `sensor_name` required; last 6h by default, or a ≤12h `start_time`/`end_time` window. No point cap |
| POST | `/api/v3/mobile_sessions/{uuid}/measurements` | Upload binary measurements (25-byte frames, 3000 max per request) |
| GET | `/api/v3/fixed_sessions` | List the signed-in user's fixed sessions (paginated) |
| POST | `/api/v3/fixed_sessions` | Create a fixed session and its streams |
| GET | `/api/v3/fixed_sessions/{uuid}` | One session, same shape as an `index` row — direct lookup by uuid |
| PATCH | `/api/v3/fixed_sessions/{uuid}` | Update title and tags. No PUT; never touches `is_indoor`, `contribute`, `time_zone`, coordinates, streams or the device |
| DELETE | `/api/v3/fixed_sessions/{uuid}` | Delete a session and record a tombstone. Safe to retry — an already-deleted uuid answers 204, not 404 |
| POST | `/api/v3/fixed_sessions/{uuid}/measurements` | Upload binary measurements (9-byte frames, 6000 max per request) |

Request and response shapes are in `swagger/swagger.yaml`; the source is
`spec/swagger/v3/mobile_sessions_spec.rb` and `spec/swagger/v3/fixed_sessions_spec.rb`.

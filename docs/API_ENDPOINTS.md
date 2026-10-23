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

## Account settings, not yet called by a shipped client

Added for the account-settings screens. v1, same path family as the rest of
`/api/user`; it gets a column above once a build calls it.

**Auth.** `/api/user`, `/api/user/settings`, `/api/user/delete_account_send_code`
and `/api/user/delete_account_confirm` take either `Authorization: Bearer <token>`
— the v3 scheme — or the original HTTP Basic `base64("<token>:X")`. Same
`authentication_token` either way; the bearer form is additive, and every
shipped build keeps working. `/api/user/sessions/*` is a different controller
and stays Basic-only.

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/user` | Change email, profile name and/or password. Send only the fields being changed — `""` means untouched. A password change requires `current_password` and a matching `password_confirmation`; an email or name change requires neither. The email applies immediately, with no confirmation mail. `authentication_token` is never rewritten or rotated, including on a password change — AirBeams hold it in EEPROM and cannot pick up a new one |

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
| POST | `/api/v3/mobile_sessions/{uuid}/finish` | Declare the recording over. Optional `finished_at` (epoch ms, UTC) so a finish queued while offline records the user's instant, not the request's; omit it and the server stamps its own clock. Safe to retry — the first value wins |
| POST | `/api/v3/mobile_sessions/{uuid}/measurements` | Upload binary measurements (25-byte frames, 3000 max per request) |
| GET | `/api/v3/fixed_sessions` | List the signed-in user's fixed sessions (paginated) |
| POST | `/api/v3/fixed_sessions` | Create a fixed session and its streams |
| GET | `/api/v3/fixed_sessions/{uuid}` | One session, same shape as an `index` row — direct lookup by uuid |
| PATCH | `/api/v3/fixed_sessions/{uuid}` | Update title and tags. No PUT; never touches `is_indoor`, `contribute`, `time_zone`, coordinates, streams or the device |
| DELETE | `/api/v3/fixed_sessions/{uuid}` | Delete a session and record a tombstone. Safe to retry — an already-deleted uuid answers 204, not 404 |
| GET | `/api/v3/fixed_sessions/{uuid}/measurements` | Measurements for one stream — `sensor_name` required; last 6h by default, or a ≤12h `start_time`/`end_time` window. No point cap. No `latitude`/`longitude` (static per-session location) |
| POST | `/api/v3/fixed_sessions/{uuid}/finish` | Decommission a monitor. Takes no body — server time; unlike the mobile route it has no `finished_at` |
| POST | `/api/v3/fixed_sessions/{uuid}/measurements` | Upload binary measurements (9-byte frames, 6000 max per request) |
| GET | `/api/v3/explore/map` | Public. Active outdoor AirBeam fixed sessions and EPA stations in a viewport, clustered on the server. `sources` and `measurement_types` are comma-separated, empty = all; whole-number `zoom`. Stations carry title, provider and measurement types; clusters only position and count. `value` (integer) only when one measurement type is selected |

Request and response shapes are in `swagger/swagger.yaml`; the source is
`spec/swagger/v3/mobile_sessions_spec.rb` and `spec/swagger/v3/fixed_sessions_spec.rb`.

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
| GET | `/api/v3/app_config` | App setup data: the Help, AirCasting Actions and Learn more link lists, titles translated. No auth |
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
| GET | `/api/v3/explore/map` | Public. Active outdoor AirBeam fixed sessions and EPA stations in a viewport, clustered on the server. `sources` and `measurement_types` are comma-separated, empty = all; whole-number `zoom`. Stations carry title, provider and a `streams` array — one entry per selected stream with `stream_id`, `sensor_name`, `measurement_type`, `unit_symbol` and a `last_measurement` `{value, time}` shaped as on `/api/v3/fixed_sessions`, `value` rounded to an integer; clusters only position and count, plus `value` when one measurement type is selected |
| GET | `/api/v3/threshold_sets` | Public. Default colour-scale bands, one entry per measurement parameter (not per AirBeam model); device spellings listed in `aliases`. The same bands the server assigns when a session is created without `thresholds`. Cacheable 1h |

Request and response shapes are in `swagger/swagger.yaml`; the source is
`spec/swagger/v3/mobile_sessions_spec.rb` and `spec/swagger/v3/fixed_sessions_spec.rb`.

### `/api/v3/threshold_sets` — two tables behind one list

Bands live in `threshold_sets` (keyed by `sensor_name` + `unit_symbol`, AirBeam
and the phone mic) and in `stream_configurations` (keyed by `measurement_type` +
`unit_symbol`, government stations). The endpoint merges them so a client never
learns which table owns what. Government bands come from `stream_configurations`
because that is what `StationStreamSerializer` serves for a station's detail
view — reading them elsewhere would let the explore map colour a station
differently from its own detail screen.

Selection is an explicit list of canonical names, never `where(is_default: true)`:
production has nineteen rows carrying that flag, including a second
`AirBeam3-PM10` whose bands are the sound-level ones. `spec/swagger/v3/threshold_sets_spec.rb`
documents the response.

### `/api/v3/app_config` — content lives in a file, not the database

`config/app_config.yml` holds all three link lists and every translation of
their titles. Editing a link, a title or the order is a deploy of that one
file — no migration, no app release. `spec/swagger/v3/app_config_spec.rb`
documents the response.

Language is one exact match, deliberately: `?locale=` is compared against
`supported_locales` in the file (case-insensitively) and anything else — an
unlisted tag, an unlisted region like `pt-BR`, or no parameter — is served as
`en-US`. There is no `Accept-Language` negotiation, no q-values and no
narrowing of a region to its base language. The response echoes `locale` so
the caller can see what it got. A single string with no entry for the asked-for
locale falls back to `en-US`, so no field is ever null for want of a
translation. The list of tags is `supported_locales` in the file — read it
there rather than from a copy here, which drifts. Adding one is not enough on
its own, either: the app's own UI strings ship in the binary, so a new language
still needs a new app build.

For the same reason the client should send the language it has resolved for
its **own** UI, not the device language. The two differ in practice: a Spanish
phone running a build that ships only English strings would otherwise get
Spanish rows inside an English screen.

It must also send the bare language code, not the raw platform identifier.
iOS `Locale.current.identifier` gives `es_MX`, Android `toLanguageTag()` gives
`pt-BR`, and with exact matching both land silently on `en-US` — pass
`languageCode` / the base tag instead.

Three things in the file are easy to get wrong when editing content:

- **`post_slug` on a Learn more card is a cross-property contract**, not a local
  id. It is the HabitatMap post's own URL slug (`page.slug`), and it is the GA4
  join key: HabitatMap reports it as `post_slug`, the outbound link carries it as
  `ac_post`, and the web map's banner already sends the same value from
  `BlogPost.postSlug` in
  `app/javascript/react/components/organisms/Modals/InfoBanner/config.ts`. A
  mobile tap and a web banner tap on the same article must land in the same GA4
  series. Set it by hand and make it match — nothing derives it from the URL,
  because a silently wrong value on a join key is worse than a missing one. See
  `HabitatMap/docs/analytics-tracking.md` §1.3 and §3.3. Help and AirCasting
  Actions rows have no identifier; they are not blog posts.
- **`category` on a card is a key into the `categories` map**, not a label. An
  unknown key is passed through verbatim, so a typo reaches a phone instead of
  raising — `spec/services/app_config/catalog_spec.rb` checks the keys against
  the map instead. A label may be a bare string rather than a locale map when
  it is a product name that does not translate (`actions: AirCasting Actions`).
  The key is `actions`, deliberately not `aircasting_actions`, so it cannot be
  confused with the top-level list of that name.
- **Learn more thumbnails are pre-sized server-side**, via the Netlify Image
  CDN rather than the older `?nf_resize=` transform:
  `/.netlify/images?url=<site-relative path>&w=192&h=192&fit=cover&fm=webp&q=70`.
  That is a 192×192 WebP of a few kB; the same crop through `nf_resize=smartcrop`
  is a ~55 kB PNG, because `nf_resize` cannot emit WebP at all. 192px covers a
  64pt thumbnail at @3x. `fit=cover` crops from the centre — add `&position=top`
  where that cuts the subject. There is no content-aware crop on that endpoint.

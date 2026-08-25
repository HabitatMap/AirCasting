# POST /api/v3/mobile_sessions

Working doc for the AirBeam mobile-session create endpoint: what changed vs the legacy
API, what production data says, and what is still open.

Updated 2026-08-19 · backend `AirCasting` · clients `AircastingAndroid`, `AirCastingiOS`

- [1. Legacy vs v3](#1-legacy-vs-v3)
- [2. Production facts](#2-production-facts)
- [3. Done](#3-done)
- [4. Settled questions](#4-settled-questions)
- [5. Backlog](#5-backlog)
  - [5.1 Sensor types + custom integrations](#51-sensor-types--custom-integrations)
  - [5.2 Device param and custom hardware](#52-device-param-and-custom-hardware)
  - [5.3 sensor_package_name](#53-sensor_package_name)
  - [5.4 Thresholds](#54-thresholds)
  - [5.5 uuid uniqueness](#55-uuid-uniqueness)
  - [5.6 Smaller items](#56-smaller-items)
  - [5.7 Client-side prerequisites](#57-client-side-prerequisites)
- [6. Devices: shipped work + evidence](#6-devices-shipped-work--evidence)
- [Appendix: how to verify](#appendix-how-to-verify)

Tests: full suite `975 examples, 6 failures`. Those 6 are pre-existing failures in
`spec/controllers/api/measurement_sessions_controller_spec.rb` (ActiveStorage / JSON mock
clash), confirmed by stashing all changes and re-running.

---

## 1. Legacy vs v3

Legacy `POST /api/sessions` → `SessionBuilder`. New `POST /api/v3/mobile_sessions` →
`Api::CreateMobileSessionContract` → `MobileSessions::Creator`.

Same: token auth, client-generated `uuid` as sync key, `title` / `tag_list` /
`contribute` / `latitude` / `longitude` / `time_zone`, tag normalization, the
`sessions` + `streams` tables, local-as-utc times, and a shareable session URL.

| Legacy | v3 |
|---|---|
| multipart; gzip+base64 `session` blob, `photos[]` | plain JSON body |
| `type` forced to `MobileSession` | implied by the route |
| `start_time` / `end_time` required | derived from measurements on ingest |
| `time_zone` optional (lat/lng fallback) | required, IANA-validated |
| `is_indoor`, `version`, `deleted` from client | server-owned |
| `notes[]` + `photos[]` at upload | notes via PATCH; photos unsupported |
| `streams` object with full metadata, thresholds, measurements | `streams` array of `{sensor_name, unit_symbol}` |
| no device | `airbeam {mac_address, model, name?}` required |
| `200 {location, notes[]}` | `201 {share_url, streams[{sensor_name, sensor_type_id}]}` |

Flow change: legacy uploaded a finished recording in one request; v3 creates the session
at recording start, then streams binary measurements to
`POST /api/v3/mobile_sessions/{uuid}/measurements`. No `session_token` — uploads use the
user token.

---

## 2. Production facts

Verified 2026-08-18/19, read-only. Sizes: `measurements` ≈ 2.49B, `streams` 1.07M,
`sessions` 288,705, `threshold_sets` 2,033, `devices` 49.

| Fact | Value | Why it matters |
|---|---|---|
| Duplicate `uuid`s in `sessions` | **552** | Blocks a unique index until cleaned |
| Mobile `is_indoor` | 233,666 false · 11,266 NULL · 79 true | "always outdoor" is 99.97% true |
| Sessions with NULL start/end | 6,619, all fixed (gov `insert_all!`) | NULL times already exist at scale |
| Mobile sessions with a device | **0 of 245,011** | Legacy mobile never linked a device |
| Distinct `(sensor_name, unit_symbol)` | 1,910 | Global `sensor_type_id`s impossible (uint8) |
| Streams on a **non-default** threshold set | 588,220 of 1.07M (**55%**) | Customized thresholds are the norm |
| `threshold_sets` marked default | 19 of 2,033 | Some sensors have none at all |
| `sensor_package_name` shapes | 882,390 `Model:mac` · 67,237 `Builtin` · 117,951 other · **0 bare mac** | v3's format matches nothing historical |

**Sensor list** (`/api/sensors`) = 5 hardcoded canonical entries + a live `GROUP BY` over
`streams` for contributed sessions. So any uploaded sensor self-registers as a map filter.
Mobile: 1,572 rows (66 with ≥100 sessions, 1,066 appear once). There is no curation
surface — `app/admin/` has only `dashboard.rb` and `users.rb`.

**Custom sensors are live**: 268–487 sessions/year from 32–77 users/year, steady through
2026 — `Bosch-BMP180`, `Alphasense-B4-NO/CO`, `Sensirion-SHT25`, `ELT-S300`, `AQGo-*`,
`TMP36`. Top blocked sensors today: `Phone Microphone` (39,235 sessions) and
`AirBeam-C`/`AirBeam2-C` (6,582).

---

## 3. Done

**Create semantics**
- `uuid` must be canonical RFC 4122; taken uuid → `session_uuid_taken` (checked in the
  creator, not the contract), including the raced case.
- Each sensor type may appear once per session (both mobile and fixed contracts).
- `is_indoor: false` server-side; start/end times stay NULL until measurements arrive.
- `Session` start/end presence validation now skips `MobileSession` only.
- `MeasurementsQuery` returns `{}` with no `end_time_local`; list orders `DESC NULLS FIRST`.
- optional `thresholds` - allow creating custom sets


**Sharing** — `share_url` added to the serializer, so list / show / PATCH carry it too;
create returns `share_url` instead of `location`. Fixed create gained `share_url` and
keeps `location` as a legacy alias (Android reads it).

**Error contract** — mobile owns `MobileSessions::ErrorCodes`. Convention, documented in
both swagger files: shape errors → `validation_error` + `fields`; state conflicts → their
own code, no `fields`. `RecordNotUnique` never leaks raw PG text.

**Devices** — see [§6](#6-devices-shipped-work--evidence).

---

## 4. Settled questions

- **NULL start/end times are safe.** Every map query drops them by SQL semantics
  (`end_time_local > start_time_local`, `BETWEEN`, `EXTRACT` — all NULL-propagating).
  Side benefit: `Api::ToMobileSessionsArray` calls `stream.average_value.round`, which
  would 500 on a measurement-less stream.
- **Mic and AirBeam sessions never mix** — the new designs make "How will you record?" a
  single choice. So `device` info is needed only when an AirBeam stream is listed.
- **No idempotent create.** Returning an existing session by uuid could hand over someone
  else's session. Keep the 400 plus a branchable error code.
- **Unknown params are ignored** (dry-schema drops them), so old clients sending
  `is_indoor` / `version` / `start_time` get a 201 with those discarded.

---

## 5. Backlog

Order of work. Each step is small on its own; the dependencies are what matter.

| # | Step | State |
|---|---|---|
| 1 | Rename `airbeam` → `device`, alias on fixed create ([5.2](#52-device-param-and-custom-hardware)) | **done** |
| 2 | Sensor types: two tiers + custom integrations ([5.1](#51-sensor-types--custom-integrations)) | **done** (mobile only) |
| 3 | Thresholds: seed mic defaults, accept client values as fallback ([5.4](#54-thresholds)) | **done** |
| 4 | `sensor_package_name` ([5.3](#53-sensor_package_name--implemented-pending-device-decision)) | implemented, **blocked** on whether `device` stays required |
| 5 | uuid duplicates + unique index ([5.5](#55-uuid-uniqueness)) | separate, can run any time |
| 6 | Error response shape ([5.7](#57-error-responses--unified-across-v3)) | **done** (server); app work remains |

Waiting on other people: mobile devs on MAC availability (blocks 4), HabitatMap on
localized measurement-type labels (§5.1) and the threshold-preferences question (§5.4).

### 5.1 Sensor types + custom integrations — done (mobile)

Two tiers on `POST /api/v3/mobile_sessions`:

- **Known sensors** — the five AirBeam types plus `Phone Microphone`. The client sends
  `sensor_name` + `unit_symbol`; the server owns the rest, and `sensor_type_id` stays
  globally stable (1–99) because AirBeam firmware is configured with it.
- **Custom sensors** — anything else. Accepted, but the client must describe them:
  `measurement_type`, `measurement_short_type`, `unit_name`, plus `thresholds` unless a
  default set exists ([5.4](#54-thresholds)). Stored verbatim, so they self-register in the
  public sensor list exactly as legacy uploads did.

`sensor_type_id` for a custom sensor is allocated **per session from 100–255** in payload
order and returned in the create response — the only consumer is the client that just
uploaded. Global ids are impossible: 1,910 distinct sensor/unit pairs against a uint8 field.

Validation floor (deliberately thin — anything stricter starts rejecting real DIY hardware):
values are trimmed, capped at 64 characters (longest in production is 41), and a custom
`sensor_name` may not reuse a built-in name in any casing.

Still open:

- **Localized `measurement_type` labels** — known sensors currently store the server's
  English label, ignoring a client's `Humidité`. That is today's behaviour, left as is;
  whether to keep, or let clients override, needs confirming with HabitatMap. Existing rows
  are untouched either way.
- **Fixed sessions keep the strict whitelist** — an AirBeamMini fixed session runs the
  binary protocol with firmware-assigned ids, so custom sensors make no sense there. Revisit
  when fixed endpoints get their pass.

### 5.2 Device param and custom hardware [DONE]

Done:

- **`airbeam` → `device`** across the mobile endpoints: create and `PATCH` request bodies,
  and the `device` key in list / show / update responses. No shipped client reads any of
  these, so it is a clean rename with no alias.
- **Fixed create accepts both.** A `before(:key_coercer)` hook in
  `Api::CreateFixedSessionContract` renames `airbeam` → `device` before validation, so
  shipped apps keep working and everything downstream sees one key. `device` wins if both
  are sent; validation errors are reported under `device`.
- **`mac_address` documented as a stable device identifier**, not necessarily a hardware
  MAC — a custom integration may send whatever id its hardware exposes — and `model` as a
  free-form string, not an AirBeam enum.
- `device` stays **required**.

Still open, and it may reopen the above:

- Old AirBeams do not report their MAC, and iOS may not be able to obtain one at all
  (mobile devs researching — see [§6](#6-devices-shipped-work--evidence)). If no reliable
  identifier exists, we go back to **`device` optional + an explicit per-stream
  `sensor_package_name`**, the way legacy worked.
- Mic-only sessions have no device at all, so "required" needs that exception once
  phone-mic sessions are supported end to end.

### 5.3 `sensor_package_name` — implemented, pending device decision

Implemented in both creators: `<Model>:<mac>` composed from the linked device (e.g.
`AirBeamMini:aa:bb:cc:dd:ee:ff`), replacing the bare mac, which matched none of the 1M
historical rows. The mac is lowercased because
`Sessions::IndexInteractor#normalized_sensor_name` lowercases everything after the first
separator before an exact-match query; legacy data splits ~evenly between cases, so
matching the filter decides it.

**Not settled**, because it depends entirely on [5.2](#52-device-param-and-custom-hardware):
the column is `NOT NULL` on every stream, so if `device` becomes optional there is nothing
to derive the value from. The current fallback to `Builtin` is wrong for custom hardware —
`Builtin` means "the phone's own sensor" (66,896 of 67,237 such rows are `Phone Microphone`)
and both apps branch on that exact string to render a stream as phone mic.

Custom integrations send real, varied values that no server can derive: `Terrier-0006666258B6`
(`Model-Serial`), `BioHarness3` (model only), `AQGo:A5C0`, `CityTech56789` — and
`InsertSensorPackageName`, a placeholder someone shipped, on 2,891 streams.

So if the MAC research comes back negative, the fix is an explicit optional
`sensor_package_name` per stream, with `Builtin` reserved for sessions that genuinely have
no device.

### 5.4 Thresholds [DONE]

Researched 2026-08-19 across the backend, both apps, and production data. The client's
account is accurate; the detail matters for the plan.

#### How it works today — server

| Path | Behaviour |
|---|---|
| Storage | `threshold_sets` (sensor_name, unit_symbol, is_default, 5 values). No unique index, no model validations. `streams.threshold_set_id` is `NOT NULL`, so every stream points at one set |
| Legacy upload | Client sends 5 values per stream → `Stream.threshold_set_from_stream` → `ThresholdSet.find_or_create_by(...)` on all 7 attributes. Any new combination creates a row |
| Legacy update (`Session#sync`) | Title, tags, notes, stream deletion only — **thresholds are never updated**. The server's copy is frozen at upload time |
| v3 create (mobile + fixed) | `ThresholdSet.find_by!(sensor_name: canonical, unit_symbol:, is_default: true)`. Server-owned; the client cannot influence it, and it **hard-fails (`internal_error`) when no default row exists** |
| Government / AirNow | Their own per-configuration default set ids |

Two different read paths, which is why one session and the map disagree:

- **One session** — serializers return that stream's own set (v3 `SessionSerializer`,
  `ToSessionHash2`, `ToMobileSessionsArray`, fixed equivalents). So a session shows the
  thresholds it was uploaded with.
- **Map legend / colour scale** — the web calls `/api/thresholds/:sensor_name?unit_symbol=`
  (`thresholdSlice.ts`) → `Stream.thresholds` → the `is_default` row, else **the most
  popular set** for that sensor/unit.

#### How it works today — apps

- **Defaults are hardcoded in each app**, per sensor: iOS in `MeasurementStream.swift`
  (e.g. PM2.5 `0/9/35/55/150`, PM10 `0/20/50/100/200`), Android in per-sensor constants and
  `MicrophoneReader` (`20/60/70/80/100`). **Neither app ever calls `/api/thresholds`.**
- **The user can edit them** — iOS `ThresholdsSettingsView`, Android `HLUDialog` / `HLUSlider`.
- **Edits are stored per sensor, not per session**: Android `sensor_thresholds` keyed by
  `sensor_name`, iOS a `SensorThreshold` entity. So one edit re-colours every session of that
  sensor on the device.
- **Upload sends the 5 values per stream**, i.e. a per-session snapshot of a per-sensor
  setting. Later edits never reach the server.
- iOS microphone calibration shifts the dB scale, which is visible server-side.

#### What production shows

- 2,033 sets: **19 default**, 1,981 non-default, 33 with `is_default` NULL.
- **588,220 streams (55%)** point at a non-default set — customized values are the norm.
- Some sensors have **no default at all**: `AirBeam2-PM10` has 20 sets and 0 defaults;
  `AirBeam2-PM2.5` 6 and 0. The "most popular" fallback is load-bearing, not a safety net.
- Identical sets are duplicated: `Phone Microphone 20/60/70/80/100` exists as at least four
  rows (id 1 with 66,840 streams, id 1343 with 324, ids 1377/1378 with one each). No unique
  index, so concurrent uploads clone rows.
- Real customization is visible: mic sets with `very_low = -100` (calibration), 64 streams.
- No set has NULL values — clients always send all five.

#### Problems to solve

1. v3 cannot store custom thresholds at all, and hard-fails for any sensor without a seeded
   default — which is most custom sensors.
2. There is no way to update thresholds after create; even legacy never had one, so the
   user's edit lives only on their phone.
3. `threshold_sets` accumulates duplicates (no unique index, `find_or_create_by` races).
4. The map's colour scale silently depends on which junk row happens to be most popular.

#### Done

1. **Phone microphone is now a supported sensor.** Added to the `Sensor::CANONICAL_*` maps
   (`sensor_type_id 6`, `dB`, `decibels`, `Sound Level`, short `dB`), so mic streams can be
   created and addressed in the binary upload. Without this the seed below would be inert.
2. **Seeded mic default set** — `20 / 60 / 70 / 80 / 100 dB`, matching what both apps ship.
   Seeds only, so **production needs `rails db:seed`** for it to exist; until then mic
   sessions fall back to the client's own values.
3. **Resolution order in both creators** (duplicated per endpoint, not shared):
   1. values sent with the stream — `find_or_create_by` on (canonical name, unit, 5 values),
      so an identical set is reused and default values reuse the default row, exactly as the
      legacy upload behaved. For a custom sensor the canonical name *is* the raw name, so the
      set lands in the same bucket the web later queries
      (`GET /api/thresholds/<sensor>?unit_symbol=…`) — for sensors with no default, these
      stored sets are what decides the map's colour scale, via the most-popular fallback;
   2. the sensor's `is_default` set;
   3. neither → `validation_error` naming the sensor, replacing the old `internal_error`.
4. **Contract** — optional `streams[].thresholds {very_low, low, medium, high, very_high}`;
   all five required when present, must ascend. A negative floor passes, which is what a
   calibrated mic scale looks like.
5. Swagger documents the resolution order; specs cover default use, custom values, reuse of
   both default and custom rows, mic creation, and the missing-default error.

Deliberately separate:

- **Duplicate cleanup + unique index on `threshold_sets`.** Note for whoever picks it up:
  dedup must key on the *canonical* sensor name, or rows like `AirBeam3--PM1`, `AiF` and
  `AirB9am3-F` survive it.

Still open (follow-up, not blocking):

- **User-level threshold preferences** (user + sensor + unit) versus per-session values.
  Both apps store the setting per sensor, so a session-level API keeps them out of sync;
  worth settling before `PATCH` support hardens into the contract.
- **Celsius** stays out: the new iOS app has no Celsius case, so the rewritten app never
  sends it, yet `AirBeam2-C` streams still arrive (last seen 2026-08-19) from old builds or
  third parties. That makes it a custom-sensor concern ([5.1](#51-sensor-types--custom-integrations)),
  not an official one.

#### Fixed sessions — adjustments needed

Marking these now; the work happens when fixed endpoints get their pass.

- `FixedSessions::Creator` **already mirrors this** — same resolution order, same optional
  `thresholds` in its contract. Additive: shipped apps send no thresholds to v3 fixed, so
  nothing changes for them, and the hard-fail is gone there too.
- The dedup migration and the unique index are **global**, so they touch fixed, government
  and AirNow rows too. Dedup must match on all identity columns, never merge across sensors.
- `/api/thresholds` and the map colour scale are shared by both session types — fixing the
  defaults benefits both.
- `threshold_alerts` is a separate feature (per user + stream, its own `threshold_value`) and
  is unaffected.

### 5.5 uuid uniqueness

552 duplicate uuids exist and there is no DB constraint — only a contract `SELECT` plus a
model validation, so two overlapping creates can both commit.

Plan: audit and resolve the duplicates → `CREATE UNIQUE INDEX CONCURRENTLY`
(`disable_ddl_transaction!`) → the `RecordNotUnique` rescues are already in place.

Related: fixed create's **uuid format** rule is new and can reject payloads that used to
succeed. Both apps generate canonical UUIDs, but check staging before release.

### 5.6 Smaller items

Decided, no action needed:
- **Device race** — two concurrent creates of one mac by one user is not a real scenario;
  the user can retry. Accepted.
- **Seed dependency** — already how the system works.
- **Abandoned empty sessions** — the app will offer session delete. Nothing server-side.
- **`contribute`** — stays required with no default, now stated in both swagger files.
- **Fixed create's uuid format rule** — verified safe: all 100 sessions created through the
  v3 path (2026-05-26 → 08-18) already carry canonical uuids, so the rule rejects nothing
  the shipped apps produce.

### 5.7 Error responses — unified across v3

Every v3 endpoint now answers errors in one shape:

```json
{ "error_code": "validation_error", "message": "Request body is invalid", "fields": { "uuid": ["is missing"] } }
```

`fields` appears **only** when the request shape is wrong, and the HTTP status carries the
same meaning as the code:

| Status | Codes |
|---|---|
| 400 | `validation_error`, `unsupported_sensor_type` |
| 401 | `unauthorized` |
| 404 | `not_found`, `session_not_found` |
| 409 | `session_uuid_taken` |
| 500 | `internal_error` |

Applied wherever a client was **checked and confirmed unaffected**; the endpoints AirBeams
post to directly are untouched, because their firmware cannot be inspected.

| Endpoint | Client | Treatment | Evidence |
|---|---|---|---|
| `mobile_sessions`, `mobile_sessions/{uuid}/measurements` | none yet — new here | unified | new on this branch |
| `fixed_sessions` create | released apps | unified | Android `FixedSessionUploader` checks only `isSuccessful`; iOS `responseValidator` throws on any non-2xx. Bodies parsed on success only |
| `fixed_sessions/{uuid}/measurements` | AirBeamMini firmware + Android | unified | firmware buckets every non-2xx (`!(200..300).contains(status)` → retry, data kept) and reads only `X-Server-Time`; Android checks `isSuccessful` |
| station_*, fixed_streams / measurements / clusters / daily averages, sessions | web only | body unified; statuses already correct | web reads neither body nor status — `getErrorMessage` returns axios's own message |
| `realtime/measurements`, `realtime/sync_measurements` | **AirBeams reporting directly**, plus apps | **untouched** | old firmware source unavailable — cannot be verified, so not changed |

`Api::V3::BaseController` carries `render_validation_error`, `render_error` and
`render_failure`; v3 controllers resolve `BaseController` lexically, so they picked it up
without changing their superclass. `Api::V3::ErrorCodes` holds the four generic codes, while
endpoint vocabularies (`MobileSessions::ErrorCodes`,
`FixedSessions::BinaryProtocol::ErrorCodes`) keep their own and stay free to drift.

Twelve controllers previously returned the raw dry-validation hash
(`{"session_type":["is missing"]}`): fixed measurements / streams / stream clusters / daily
averages, station measurements / streams / daily averages, sessions, fixed polling, fixed
streaming measurements, and both `*/measurements` endpoints. Verified live afterwards:

```
GET  /api/v3/fixed_measurements          400 {error_code: validation_error, message, fields}
GET  /api/v3/sessions?start_datetime=x   400 {error_code: validation_error, message, fields}
GET  /api/v3/station_streams/999999      404 {error_code: not_found, message}
POST /api/v3/mobile_sessions (no auth)   401 {error_code: unauthorized, message}
```

Safe to change: nothing parsed the old bodies. The apps throw a generic error on any non-2xx,
and the web's `getErrorMessage` reads the thrown error's `.message`, never the response body.

**Still on the app side:**

- **Decode `{error_code, message, fields}`** into a typed error. Until then
  `session_uuid_taken` and the rest stay invisible to users — Android throws
  `UnexpectedAPIError`, iOS a generic `URLError` with a literal `// TODO: throw proper error`.
- **Read `share_url` from the sync response**, not only from create. List / show / update all
  return it, so mapping it like legacy `location` is enough; reading only the create response
  loses the link for sessions that arrived from another device. (`url_token` is unique in
  production — 288,766 sessions, zero collisions — because the generator lengthens the token
  on a clash.)


## 6. Devices: shipped work + evidence

### The problem

`devices` had a **global** unique index on `mac_address`, and all writers did
`find_or_initialize_by(mac_address:)` then overwrote `model` / `name`. Since the address is
not a reliable identifier, unrelated users collapsed into one row and the last writer won —
and `name` is user-authored text served back to both as `airbeam.name`.

What the clients actually send:
- Android: `sensorPackageName.substringAfterLast(':')` — the **last octet only**
  (`AirBeamMini:24:58:7C:AC:A6:B6` → `"B6"`).
- iOS: the MAC parsed from the BLE advert, else `macAddressLike(from: device.uuid)`, a
  MAC-shaped string derived from the per-app CoreBluetooth UUID (differs per phone).

Production, 49 rows, all `AirBeamMini`: 34 real MACs, **14 two-character**, 1 raw UUID.

### Evidence: it already happened

Three devices are shared across users. All their sessions are fixed; `200, 200` is the
indoor placeholder coordinate.

| Device | mac | User | Sessions | Location | Dates |
|---|---|---|---|---|---|
| 9 | `24:58:7C:AC:A6:B6` | 7562 `Kirill` | 6 | 3 × Kraków `50.0047, 20.0618`, 3 × indoor | 06-26 → 07-09 |
| 9 | | 19649 `jfjsnbei 2849` | 2 | indoor | 07-22 |
| 10 | `CC:8D:A2:6B:06:4A` | 87 `scooby` | 1 | Brooklyn `40.6804, -73.9764` | 06-29 |
| 10 | | 2 `HabitatMap` | 1 | indoor | 07-07 |
| 13 | `B6` | 7562 `Kirill` | 3 | indoor | 07-07 |
| 13 | | 14547 `Herwig` | 1 | indoor | 07-28 → 08-05 |

Each device's `name` equals the **later** user's session title, and `updated_at` matches
that session's `created_at` to the second — the overwrite, visible in the data.

Reading (to confirm with HabitatMap and the mobile team):
- **9** — internal test unit in Kraków. `Kirill` has 1,536 sessions, ~94% Kraków;
  `jfjsnbei 2849` signed up 6 days earlier with a `gmail.con` typo domain.
- **10** — probably two internal accounts: `HabitatMap` (habitatmap.org, 2011) and
  `scooby` (`scooby.com`, 2012) share a NYC base and both have sessions in Honolulu and
  Kraków. Circumstantial.
- **13** — a genuine conflict: `Kirill` (Kraków) and `Herwig` (Dubai, 13 located sessions),
  ~4,000 km apart.

**`B6` cannot be attributed to any unit** — it matches the last octet of three different
full addresses in the same table. Ten short rows shadow a full-mac row this way.

Consequence for `docs/domain_model.md` §7.3, which proposes `mac_address UNIQUE NOT NULL`
to power "see all sessions recorded by this device": that needs a trustworthy global
identifier, which this data cannot provide. Per-user scoping is the safe state; global
identity can be layered on later for rows whose identifier is verifiably complete.

### The fix (implemented)

Devices are **per user**. One AirBeamMini pairs with one phone at a time, so a shared
device is simply defined once per user.

- `Device` — `belongs_to :user`, uniqueness scoped to `user_id`, trim + upcase on write.
- `User has_many :devices, dependent: :destroy`.
- Both creators and the mobile updater use `user.devices.find_or_initialize_by(...)`.

### Deploy plan — three phases, no breaking step

The migrations are split so each deploy is safe on its own. This ships **before** the rest
of the API work, so no new duplicate devices accumulate meanwhile.

| Phase | File | Deploy | Safe because |
|---|---|---|---|
| 1 | `20260818120000_add_user_to_devices` | 1, migrations only | Additive: nullable column, plus an index and a FK added `validate: false` then validated separately, so `users` (19k rows) is never locked for a full scan |
| 2 | `20260818120001_scope_device_uniqueness_to_user` | 1, right after | Backfills owners, drops orphans, swaps the index, splits shared rows, merges case variants, normalizes. `user_id` stays **nullable**, so the currently deployed code keeps working — rows it creates in the gap simply have no owner |
| — | application code | 2 | Scoped writers; every new device gets an owner |
| 3 | `20260819120000_require_device_user` | 3 | Backfills anything created in the gap, refuses to continue if a device still has no owner, then sets `NOT NULL` |

Details worth keeping:
- **Order inside phase 2**: index swap happens *before* the split, because the split
  creates a second row with the same address by definition, and normalizing can make two
  users' addresses equal — both illegal under the old global unique index.
- **Every step is idempotent** (`IS DISTINCT FROM` guards, `ON CONFLICT DO NOTHING`,
  `index_exists?`), so a re-run or a partial failure is harmless.
- **`NOT NULL` via a validated CHECK** — `ADD CONSTRAINT ... NOT VALID` → `VALIDATE` →
  `SET NOT NULL` → drop the constraint. On PG12+ that avoids a blocking full-table scan.
- **Plain, not CONCURRENT, index operations**: `devices` holds ~49 rows, so the ACCESS
  EXCLUSIVE lock lasts microseconds. `CONCURRENTLY` would cost the migration its
  transaction and can leave an INVALID index behind — more operational risk than it saves
  at this size.
- **Phase 3 fails loudly** rather than silently dropping data if an unowned device remains.

Expected effect on production (measured 2026-08-18; re-check before deploy): 44 devices get
an owner · 3 pairs split · 4 sessions repointed · 5 orphans deleted · 49 → 47 rows.

**Rehearsed locally** (2026-08-19) against a copy of production's device topology plus the
case-collision fixtures prod does not have. The rehearsal caught two ordering bugs before
they could reach production — normalizing and splitting both violated the global unique
index — which is why the swap now comes first. All three phases were then run from a clean
pre-migration state, `db:migrate:redo` proved phase 3 is repeatable, and the end state
verified: no unowned devices, no orphans, no unnormalized addresses, no session whose owner
differs from its device's owner, no duplicate `(user_id, mac_address)`, and the temporary
CHECK constraint removed.

`db/schema.rb` was first hand-written because the `development` config points at
production; the local run then regenerated it and produced the same file.

### Identifier options (for the mobile team)

iOS cannot read a BLE MAC at all — `CBPeripheral.identifier` is an OS UUID, per phone and
per install. Android can read the peripheral's address. So the only cross-platform identity
is what the firmware reports.

| Option | Notes |
|---|---|
| MAC in the BLE advert (today's V2 path) | Works on both platforms, no connection needed. Fix Android to send the full address |
| GATT Device Information Service serial | Firmware-owned, survives BLE address privacy; needs a connection |
| Manufacturer data in the advert | Like the advert name but structured |
| Server-issued token written to firmware | Strongest, needs firmware write support |

Suggested contract: send `mac_address` **only** when it genuinely came from the firmware,
plus a separate `client_device_ref` for the platform handle, plus `mac_source`
(`firmware` / `derived`). Only `firmware`-sourced rows would ever be eligible for global
device identity — a format rule cannot do this, because iOS's derived value is a
well-formed MAC.

---

## Appendix: how to verify

Production is readable through the app's `development` config (`aircasting_production` @
45.33.78.113, read-limited user — writes are denied). **Never run migrations from here.**
Use `SET statement_timeout` and never touch `measurements` (2.5B rows).

```sql
-- duplicates blocking a unique index on sessions.uuid
SELECT count(*) FROM (SELECT uuid FROM sessions GROUP BY uuid HAVING count(*) > 1) t;
-- device linkage for mobile sessions
SELECT (device_id IS NULL), count(*) FROM sessions WHERE type='MobileSession' GROUP BY 1;
-- sensor identity cardinality vs the uint8 wire field
SELECT count(DISTINCT sensor_name), count(DISTINCT (sensor_name, unit_symbol)) FROM streams;
-- share of streams on customized thresholds
SELECT ts.is_default, count(*) FROM streams st
JOIN threshold_sets ts ON ts.id = st.threshold_set_id GROUP BY 1;
-- custom-sensor activity by year
SELECT date_part('year', s.start_time_local)::int, count(DISTINCT s.id), count(DISTINCT s.user_id)
FROM sessions s JOIN streams st ON st.session_id = s.id
WHERE st.sensor_name NOT ILIKE 'AirBeam%' AND st.sensor_name NOT ILIKE 'Phone Microphone%'
  AND st.sensor_package_name NOT IN ('epa','eea') AND st.sensor_name NOT ILIKE 'Government%'
  AND s.start_time_local >= '2019-01-01'
GROUP BY 1 ORDER BY 1;
```

Public read-only: `GET https://aircasting.org/api/sensors?session_type=MobileSession|FixedSession`.

Local migration rehearsal: seed `aircasting_development` from prod's device rows, then
`DATABASE_URL="postgis://postgres@localhost/aircasting_development" bundle exec rails db:migrate`.

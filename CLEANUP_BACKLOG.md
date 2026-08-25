# Cleanup backlog

Data and small code problems found while reviewing the v3 mobile session endpoints
(see `CREATE_MOBILE_SESSIONS.md`). **None of them block the API work** — they are listed
here so they are not lost, and because several become harder once new endpoints rely on the
same tables.

All figures verified against production, read-only, 2026-08-18/19.

These are **not** numbered steps — nothing here is sequenced, and none of it overlaps the
endpoint backlog in `CREATE_MOBILE_SESSIONS.md` §5. The one shared topic, duplicate session
uuids, lives there (§5.5) because the create endpoint depends on it; it is not repeated here.

| Item | Impact today | Effort |
|---|---|---|
| [Duplicate + corrupt `threshold_sets`](#threshold_sets) | map colours decided by a popularity contest | medium |
| [Ambiguous device identifiers](#ambiguous-device-identifiers) | one AirBeam registered twice | app-side first |
| [Junk stream metadata](#junk-stream-metadata) | clutters the public sensor list | low |
| [Sensor filter exclusion list](#sensor-filter-exclusion-list) | duplicate filter entries | low |
| [`is_indoor` NULLs](#is_indoor-nulls) | cosmetic | low |

---

## `threshold_sets`

**Context.** 2,033 rows, of which only 19 are `is_default`. The web resolves colours through
`Stream.thresholds(sensor_name, unit_symbol)`, which prefers the `is_default` row and
otherwise falls back to the **most popular** set for that sensor/unit.

Which name is asked for depends on what the user selected. The *basic* sensor list is built
from the frontend's canonical constants, so AirBeam selections resolve canonically and the
per-device rows are never consulted. The *custom* list passes the stored name verbatim —
`GET /api/thresholds/AM2302T?unit_symbol=°C` is a real request, and it returns
`["0","10","20","30","40"]` from set 437 (9 streams) rather than set 435 (5 streams). So for
every sensor without a default, the sets stored on streams **are** the colour scale.

Four distinct problems:

**a. The fallback is load-bearing.** `AirBeam-C` has no default at all, so Celsius colouring
is whatever the crowd sent most often — set id 213 (`0/10/20/30/40`, 8,994 streams) beats the
runner-up (`-17/-4/10/24/38`, 8 streams). Any officially supported sensor without a default
is decided this way.
→ *Seed a default for every supported sensor.* One line each, same shape as the mic default.

**b. Corrupt default rows.**
- `AirBeam2-PM1` / `-PM2.5` / `-PM10` carry unit **`ng/m`** instead of `µg/m³`.
- `AirBeam-PM` carries **`Âµg/mÂ³`** (mojibake).
- `AirBeam3-PM10` has **two** default rows, one holding the microphone scale
  (`20/60/70/80/100`).

Unreachable today, because AirBeam selections resolve canonically — so they are harmless
until someone dedupes the table or changes how names are resolved, at which point they
become live.
→ *Fix or delete them before any dedup runs.*

**c. Dead per-device rows.** `db/seeds.rb` maintains `AirBeam2-*` / `AirBeam3-*` /
`AirBeamMini-*` sets. All AirBeam models are meant to share one scale per measurement type,
and the frontend only asks canonically, so these are leftovers — and they disagree with each
other (`AirBeam2-F` is `0/25/50/75/100`, `AirBeam-F` and `AirBeam3-F` are `15/45/75/105/135`;
`AirBeam2/3` PM low bound is 12 where canonical is 9).
→ *Delete, and stop seeding them.*

**d. Duplicates.** No unique index, and `find_or_create_by` races, so identical rows pile up:
`Phone Microphone 20/60/70/80/100` exists at least four times (id 1 with 66,840 streams,
id 1343 with 324, two more with one each).
→ *Dedup, repoint `streams.threshold_set_id`, then add a unique index on
(sensor_name, unit_symbol, 5 values).*

Two constraints pull against each other here. Merging only exact `(sensor_name, unit_symbol,
values)` matches leaves the typo rows (`AirBeam3--PM1`, `AiF`, `AirB9am3-F`) in place;
merging by canonical name would fold them in, **but must not merge across names or units that
the web queries separately** — a custom sensor is looked up by its raw name, so
`AM2302T | °C` is its own bucket and collapsing it would silently recolour those sessions.
Safest split: dedup exact duplicates globally, and treat typo-name folding as a separate,
reviewed decision.

**Why it matters.** Colour scales are the main way a reading is interpreted. Today two
sessions of the same pollutant can be coloured differently depending on which row won a
popularity contest.

---

## Ambiguous device identifiers

**Context.** Of 49 device rows, **14 hold a two-character `mac_address`** (Android sends only
the last MAC octet on its live-measurement path) and one holds a raw UUID (iOS derives a
MAC-shaped value from the per-app CoreBluetooth id). Ten short rows shadow a full-MAC row;
`B6` matches three different full addresses.

**Why it matters.** Devices are now scoped per user, so the cross-user damage is fixed. What
remains is that one physical AirBeam can exist as two rows for the same user, and that
`docs/domain_model.md` §7.3's "see all sessions recorded by this device" feature has no
trustworthy key to build on.

**Proposal.** App-side first (mobile devs are researching): send the full address, or a
firmware-provided serial. Then optionally add a `mac_source` (`firmware` / `derived`) so only
verifiable identifiers are eligible for global device identity — a format rule cannot do this,
because the iOS-derived value is a well-formed MAC.

---

## Junk stream metadata

**Context.** Legacy stored whatever the client sent, with only presence validation. Production
holds `AirBam3--RH | Partdityate Matter`, `AAirBeam3-RH`, `AirBeam3-PM2.Partrticate e Maer`
with unit `µg�g/m`, and 2,891 streams whose `sensor_package_name` is the literal
`InsertSensorPackageName`.

**Why it matters.** `/api/sensors` is built by grouping over `streams`, so every typo becomes
a selectable filter option — 1,572 rows for mobile, of which 1,066 appear exactly once.

**Proposal.** Low priority and needs care: these are real user sessions, so renaming or
deleting changes what those users see. A safer first step is to hide rows below a session-count
threshold from the *custom* filter lists, which is presentation-only and reversible. v3's
validation floor stops new junk regardless.

---

## Sensor filter exclusion list

**Context.** `Api::ToSensorsArray` hides nine per-model names (`AirBeam2/3/Mini-PM1/PM2.5/PM10`)
so they do not appear next to the canonical PM entries. **RH, F and C aliases were never added**,
so `AirBeam3-F` (69,364) and `AirBeam2-RH` (57,782) show as their own filter rows beside
`AirBeam-F` and `AirBeam-RH`, which already include them.

**Why it matters.** Users see three filter options where one would do, and picking either gives
overlapping results.

**Proposal.** Extend the exclusion list to the RH / F / C aliases, or better, derive it from
`Sensor::CANONICAL_SENSOR_NAME_MAP` so it cannot drift again.

---

## `is_indoor` NULLs

**Context.** 11,266 mobile sessions have `is_indoor = NULL`, 79 have `true`, 233,666 have
`false`. v3 now writes `false` for every mobile session.

**Why it matters.** Barely — nothing filters mobile sessions by it. It is inconsistent with
the gov/AirNow writers, which always set `false`.

**Proposal.** One `UPDATE ... WHERE is_indoor IS NULL AND type = 'MobileSession'`, if anyone
is touching that table anyway. Decide first what the 79 `true` rows mean.

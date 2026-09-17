# Swagger / OpenAPI Docs

## How the docs are organised

Every operation belongs to exactly one tag, and the tag name is the grouping
shown in the Swagger UI sidebar. Two families:

- **`Mobile app:`** — called by the released iOS and Android builds.
- **`Web app:`** — called by the React frontend.

No endpoint belongs to both: the two clients use separate paths even where the
data overlaps (`/api/fixed/active/sessions.json` vs `sessions2.json`,
`/api/sessions/export_by_uuid.json` vs `/api/sessions/export.json`, which is why
each client has its own *Export & sharing* tag). If that
ever changes, list the operation under the client it is documented *for* rather
than tagging it twice — Swagger UI renders a two-tag operation in both groups,
which reads as two endpoints.

A tag ending in **`[DEPRECATED]`** holds the pre-v3 endpoints kept alive for
already-released mobile builds. Every operation in one also carries
`deprecated true`, which is what strikes it through in the UI. Each legacy tag
sits directly after the tag that replaces it, so the pairing is visible in the
sidebar.

Tag order and descriptions live in `spec/swagger_helper.rb`. Adding an
operation with a tag that is not declared there still renders, but at the
bottom and without a description — declare the tag.

## Where things live

`spec/swagger/**/*_spec.rb` is the **source of truth**; edit these to change
the docs. `swagger/swagger.yaml` is generated — never edit it by hand.

### Mobile app

| Tag | Spec file |
|---|---|
| Account & auth | `mobile_app_account_spec.rb` |
| Mobile sessions | `v3/mobile_sessions_spec.rb`, `v3/mobile_session_notes_spec.rb` |
| Mobile sessions [DEPRECATED] | `mobile_app_sessions_sync_spec.rb` |
| Fixed sessions | `v3/fixed_sessions_spec.rb` |
| Fixed sessions [DEPRECATED] | `mobile_app_realtime_spec.rb` (create + upload + poll), `mobile_app_fixed_spec.rb` (session and stream reads) |
| Threshold alerts | `mobile_app_threshold_alerts_spec.rb` |
| Export & sharing | `mobile_app_export_spec.rb` |

### Web app

| Tag | Spec file |
|---|---|
| Fixed sessions | `fixed_sessions_lists_spec.rb` (map lists), `v3/fixed_streams_spec.rb`, `v3/measurements_spec.rb`, `v3/daily_averages_spec.rb` |
| Mobile sessions | `mobile_sessions_spec.rb` |
| Station data (government) | `v3/station_streams_spec.rb`, `v3/measurements_spec.rb`, `v3/daily_averages_spec.rb` |
| Map aggregations | `crowdmap_region_timelapse_spec.rb` |
| Autocomplete | `autocomplete_spec.rb` |
| Sensors & thresholds | `thresholds_and_sensors_spec.rb` |
| Export & sharing | `exports_and_short_url_spec.rb` |

`v3/measurements_spec.rb` and `v3/daily_averages_spec.rb` each hold the AirBeam
and the Station variant of one endpoint pair, so they appear under two tags.

## Writing a description

**Default to no description.** The summary, the parameter list and the response
schema already say what the endpoint is and what it returns; most operations
here carry no `description` at all. Add one only for something a reader cannot
get from the schema:

- error-code tables, retry rules, binary layouts, size limits;
- concurrency and idempotency behaviour (racing creates, safe-to-retry deletes);
- which endpoint replaces a deprecated one;
- a genuine oddity (a placeholder path segment, a gzipped response).

Never restate the summary, a parameter, a property, or an example. A fact about
one field belongs in that field's `description`, not in prose. Rationale,
history and notes to the next maintainer go in a Ruby comment in the spec file,
which is not published.

Use `## Heading` sections only when an operation genuinely has several such
topics. Otherwise one short paragraph, or nothing.

## Authentication in the specs

Two schemes, split by API version — this is the code, not a preference:

| Endpoints | Scheme | Enforced by |
|---|---|---|
| `/api/v3/**` | `Authorization: Bearer <user_token>` | `Api::V3::BaseController#authenticate_user_from_bearer_token` |
| everything else under `/api` | `Authorization: Basic base64("<user_token>:X")` | `Api::BaseController#authenticate_user_from_token!` |

`Api::BaseController#authenticate_user_from_token!` returns early unless the
header starts with `Basic`, so a Bearer token on a pre-v3 endpoint is not an
error — it is silently unauthenticated, and the request fails as anonymous.
Go by the filter, not the class name: `POST /api/realtime/measurements` is
routed to `Api::V3::FixedStreaming::MeasurementsController` yet calls the Basic
filter, so it belongs in the second row.

The global `security` in `spec/swagger_helper.rb` is `bearer_auth`, which is
right for v3 and wrong for everything else. Declare per operation:

| Operation accepts | Declare |
|---|---|
| Bearer (v3 default) | nothing |
| No auth (public read) | `security []` |
| Basic (any authenticated pre-v3 endpoint) | `security [{ basic_auth: [] }]` |
| Bearer **and** Basic | `security [{ bearer_auth: [] }, { basic_auth: [] }]` |

The last row is one operation: `POST /api/v3/fixed_sessions`, because released
Android and iOS builds already post Basic to it. A second one needs a
`client-contract` verdict naming the released build and the file:line that
sends Basic.

`basic_auth` stays off the global `security` list. Declaring it API-wide would
document it as accepted everywhere, which is both wrong and a wider claim than
any endpoint makes.

The specs authenticate through warden (`before { sign_in user }`), so the
`let(:Authorization)` value never decides whether an example passes — it is
what the docs display. Keep it matching the declared scheme.

## Terminology (keep it unified)

Descriptions and tags use one vocabulary for the three data families:

| Term | Meaning | Data model |
|------|---------|-----------|
| **AirBeam fixed** | Roof-mounted AirBeam, streams continuously over WiFi. **The old `realtime/*` endpoints operate on these** (`FixedSession`). | `sessions`/`streams`/`fixed_measurements` (legacy); `fixed_streams` (target) |
| **AirBeam mobile** | AirBeam in motion, uploaded when the session finishes. | `sessions`/`streams`/`measurements` (`MobileSession`) |
| **Station** | Government (EEA/EPA) integration data. | `station_streams`/`station_measurements` |

Do **not** reintroduce "realtime" as a data family (it's a legacy URL prefix for AirBeam fixed) or use bare "government" as the family noun (use "Station (government)"). Literal values the API returns — the `'Government'` username, `government-pm2.5` sensor names — stay as-is.

## Gotchas

- Two different `q` conventions: session/averages/timelapse endpoints take **one `q` param = a URL-encoded JSON string**; the autocomplete endpoints take **nested `q[...]` params** (`q[input]`, `q[west]`, …). `time_from`/`time_to` are always **Unix epoch seconds**, parsed before the contract — so a missing time raises before validation (a `400` test must send valid times and omit a different field).
- `GET /api/fixed/active/sessions2` force-gzips its success body, which rswag's JSON-schema validator can't read, so its `200` is documentation-only (`skip`); the schema is still emitted.
- Validation-error bodies are not uniform: some endpoints return `{field: [msgs]}` (object), others (e.g. `mobile/sessions`) return `[{text, path}]` (array).

## Regenerating swagger.yaml

After changing any spec under `spec/swagger/`, regenerate with:

```sh
./scripts/swagger_generate
```

The script runs:
```sh
RAILS_ENV=test bundle exec rake rswag:specs:swaggerize PATTERN="spec/swagger/**/*_spec.rb"
```

The `PATTERN` override is required because rswag defaults to `spec/requests/**`, `spec/api/**`, and `spec/integration/**` — none of which match our spec location.

Commit `swagger/swagger.yaml` alongside your spec changes so the hosted Swagger UI stays in sync.

## Viewing the docs

The Swagger UI is served at `/api-docs` when the app is running (provided by the `rswag-ui` gem).

## How the spec works

The specs use the rswag DSL to declare endpoints, parameters, and response schemas. The `run_test!` examples are real integration tests — they hit the app and validate the response matches the declared schema.

Examples marked `skip 'swagger doc'` are documentation-only (no live request). Avoid this pattern for new endpoints; use `run_test!` with proper test data instead.

When adding a new endpoint:
1. Add a `path` block in the spec file.
2. Declare all `parameter` and `response` schemas.
3. Set up test data in `let` / `before` blocks.
4. Use `run_test!` — rswag will run the request and assert the response status.
5. Run the rake task above to regenerate `swagger.yaml`.

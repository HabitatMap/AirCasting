# Swagger / OpenAPI Docs

## Where things live

| File | Purpose |
|------|---------|
| `spec/swagger/**/*_spec.rb` | **Source of truth.** Edit these to change API docs. One file per resource group. |
| `spec/swagger/v3/fixed_sessions_spec.rb` | AirBeamMini fixed sessions binary flow (create + binary measurements). |
| `spec/swagger/v3/mobile_sessions_spec.rb` | AirBeam mobile sessions: CRUD, list, and the binary measurements upload. |
| `spec/swagger/v3/fixed_streams_spec.rb` | `GET /api/v3/fixed_streams/{id}` (AirBeam stream detail). |
| `spec/swagger/v3/station_streams_spec.rb` | `GET /api/v3/station_streams/{id}` + `.../export` (government, new model). |
| `spec/swagger/v3/measurements_spec.rb` | `GET /api/v3/fixed_measurements` + `station_measurements`. |
| `spec/swagger/v3/daily_averages_spec.rb` | `GET /api/v3/fixed_stream_daily_averages` + `station_stream_daily_averages`. |
| `spec/swagger/thresholds_and_sensors_spec.rb` | `GET /api/thresholds/{id}` + `GET /api/sensors`. |
| `spec/swagger/fixed_sessions_lists_spec.rb` | `GET /api/fixed/active/sessions2` + `/api/fixed/dormant/sessions` (web map, `q` JSON). |
| `spec/swagger/mobile_sessions_spec.rb` | `GET /api/mobile/sessions` + `/api/mobile/streams/{id}`. |
| `spec/swagger/autocomplete_spec.rb` | `GET /api/{fixed,mobile}/autocomplete/tags` + `/api/autocomplete/usernames` (nested `q[...]` params). |
| `spec/swagger/crowdmap_region_timelapse_spec.rb` | `GET /api/averages2` + `/api/region` + `/api/v3/timelapse`. |
| `spec/swagger/exports_and_short_url_spec.rb` | `GET /api/sessions/export` + `POST /api/short_url`. |
| `spec/swagger/mobile_app_account_spec.rb` | Mobile apps: sign in/up, settings, account deletion, password reset. |
| `spec/swagger/mobile_app_sessions_sync_spec.rb` | Mobile apps: session upload, download (empty.json), sync, update, export-by-uuid. |
| `spec/swagger/mobile_app_realtime_spec.rb` | Mobile apps: fixed WiFi session create, stream measurements, sync_measurements. |
| `spec/swagger/mobile_app_fixed_spec.rb` | Mobile apps: fixed active list, session/streams detail, single stream. |
| `spec/swagger/mobile_app_threshold_alerts_spec.rb` | Mobile apps: threshold alerts (list/create/delete). |
| `spec/swagger_helper.rb` | rswag configuration (output path, OpenAPI version, global security schemes, tag order). |
| `swagger/swagger.yaml` | Generated output. **Do not edit by hand** — changes will be overwritten on next generation. |

## Authentication in the specs

The global `security` in `spec/swagger_helper.rb` is `bearer_auth`
(`Authorization: Bearer <user_token>`). An authenticated operation declares
nothing; it inherits that.

Override per operation, one line, no prose:

| Operation accepts | Declare |
|---|---|
| Bearer (the default) | nothing |
| No auth (public read) | `security []` |
| Bearer **and** deprecated Basic | `security [{ bearer_auth: [] }, { basic_auth: [] }]` |

`basic_auth` is the deprecated `Basic base64("<user_token>:X")` scheme. It is
never global and it is not for new endpoints. One operation declares it —
`POST /api/v3/fixed_sessions`, in `spec/swagger/v3/fixed_sessions_spec.rb` —
because released Android and iOS builds already post it. Adding a second needs
a `client-contract` verdict naming the released build and the file:line that
sends Basic to it.

Keep the deprecation note on that operation. Documenting the weaker scheme
API-wide reads as API-wide permission, and spelling out which endpoints accept
it is a map of where to try it.

## Terminology (keep it unified)

Descriptions and tags use one vocabulary for the three data families:

| Term | Meaning | Data model |
|------|---------|-----------|
| **AirBeam fixed** | Roof-mounted AirBeam, streams continuously over WiFi. **The old `realtime/*` endpoints operate on these** (`FixedSession`). | `sessions`/`streams`/`fixed_measurements` (legacy); `fixed_streams` (target) |
| **AirBeam mobile** | AirBeam in motion, uploaded when the session finishes. | `sessions`/`streams`/`measurements` (`MobileSession`) |
| **Station** | Government (EEA/EPA) integration data. | `station_streams`/`station_measurements` |

Do **not** reintroduce "realtime" as a data family (it's a legacy URL prefix for AirBeam fixed) or use bare "government" as the family noun (use "Station (government)"). Literal values the API returns — the `'Government'` username, `government-pm2.5` sensor names — stay as-is.
>
> Gotchas seen while documenting the web endpoints:
> - Two different `q` conventions: session/averages/timelapse endpoints take **one `q` param = a URL-encoded JSON string**; the autocomplete endpoints take **nested `q[...]` params** (`q[input]`, `q[west]`, …). `time_from`/`time_to` are always **Unix epoch seconds**, parsed before the contract — so a missing time raises before validation (a `400` test must send valid times and omit a different field).
> - `GET /api/fixed/active/sessions2` force-gzips its success body, which rswag's JSON-schema validator can't read, so its `200` is documentation-only (`skip`); the schema is still emitted.
> - Validation-error bodies are not uniform: some endpoints return `{field: [msgs]}` (object), others (e.g. `mobile/sessions`) return `[{text, path}]` (array).

## Regenerating swagger.yaml

After changing `spec/swagger/v3/fixed_sessions_spec.rb`, regenerate with:

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

`spec/swagger/v3/fixed_sessions_spec.rb` uses rswag DSL to declare endpoints, parameters, and response schemas. The `run_test!` examples are real integration tests — they hit the app and validate the response matches the declared schema.

Examples marked `skip 'swagger doc'` are documentation-only (no live request). Avoid this pattern for new endpoints; use `run_test!` with proper test data instead.

When adding a new endpoint:
1. Add a `path` block in the spec file.
2. Declare all `parameter` and `response` schemas.
3. Set up test data in `let` / `before` blocks.
4. Use `run_test!` — rswag will run the request and assert the response status.
5. Run the rake task above to regenerate `swagger.yaml`.

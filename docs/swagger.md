# Swagger / OpenAPI Docs

## Where things live

| File | Purpose |
|------|---------|
| `spec/swagger/**/*_spec.rb` | **Source of truth.** Edit these to change API docs. One file per resource group. |
| `spec/swagger/v3/fixed_sessions_spec.rb` | AirBeamMini fixed sessions binary flow (create + binary measurements). |
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
| `spec/swagger_helper.rb` | rswag configuration (output path, OpenAPI version, global security schemes). |
| `swagger/swagger.yaml` | Generated output. **Do not edit by hand** — changes will be overwritten on next generation. |

> Public read endpoints override the global token auth with `security []` per operation.
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

# Swagger / OpenAPI Docs

## Where things live

| File | Purpose |
|------|---------|
| `spec/swagger/v3/fixed_sessions_spec.rb` | **Source of truth.** Edit this to change API docs. |
| `spec/swagger_helper.rb` | rswag configuration (output path, OpenAPI version, global security schemes). |
| `swagger/v3/swagger.yaml` | Generated output. **Do not edit by hand** — changes will be overwritten on next generation. |

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

Commit `swagger/v3/swagger.yaml` alongside your spec changes so the hosted Swagger UI stays in sync.

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

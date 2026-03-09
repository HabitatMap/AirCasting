# AirCasting Architecture: Domain Model

---

## 1. Current State Overview

Two parallel migrations are in progress:

1. **Government integrations (EEA, EPA)** use **dual-writing** into both the legacy model and the new `station_streams` model. Reads will switch to `station_streams` soon (PR #1161).

```
                    ┌──────────────────────────────────────┐
                    │         GOVERNMENT DATA              │
                    │         (EEA / EPA)                  │
                    └──────────────┬───────────────────────┘
                                   │ write
                    ┌──────────────┴───────────────────────┐
                    │         DUAL WRITE (current)         │
          ┌─────────┴──────────┐            ┌──────────────┴──────────┐
          │   LEGACY PATH      │            │    NEW PATH             │
          │ sessions/streams   │            │   station_streams       │
          │ fixed_streams      │            │   station_measurements  │
          │ fixed_measurements │            │   station_stream_       │
          │ hourly_averages    │            │     daily_averages      │
          └─────────┬──────────┘            └──────────────┬──────────┘
                    │ read (today)                         │ read (soon, PR #1161)
                    └──────────────┬───────────────────────┘
                                   │
                              Frontend / API
```

2. **AirBeam fixed sessions** currently use the legacy `sessions → streams → fixed_measurements` path. The plan is to migrate them to `fixed_streams → fixed_measurements` (via `fixed_stream_id`). This is separate from the government migration.

```
        AIRBEAM FIXED SESSIONS

        Mobile app → API
              │
              │ write
      ┌───────┴────────────────────┐
      │    CURRENT (legacy)        │
      │ sessions/streams/          │
      │   fixed_measurements       │
      │   (via stream_id)          │
      └───────┬────────────────────┘
              │ future plan ↓
     ┌────────┴────────────────────┐
     │    TARGET                   │
     │ fixed_streams/              │
     │   fixed_measurements        │
     │   (via fixed_stream_id)     │
     └─────────────────────────────┘





```

---

## 2. New Model: Government Stations

Introduced to replace `fixed_streams`/`fixed_measurements` for government data (EEA, EPA). Simpler, clean schema — no legacy coupling.

```
┌───────────────────────┐        ┌──────────────────────────┐
│       sources         │        │   stream_configurations  │
│  id                   │        │  id                      │
│  name (EEA, EPA)      │        │  measurement_type        │
└───────────┬───────────┘        │  unit_symbol             │
            │                    │  threshold_*             │
            │ source_id          │  canonical               │
            │                    └──────────────┬───────────┘
            │                                   | stream_configuration_id
            ▼                                   ▼
┌───────────────────────────────────────────────────────────┐
│                      station_streams                      │
│  id, uuid, source_id, stream_configuration_id             │
│  external_ref (sampling point ID)                         │
│  location (PostGIS), time_zone, title, url_token          │
│  first_measured_at, last_measured_at                      │
└────────────────────────────┬──────────────────────────────┘
                             │
              ┌──────────────┴──────────────────┐
              ▼                                 ▼
┌─────────────────────────┐     ┌───────────────────────────────┐
│   station_measurements  │     │  station_stream_daily_averages│
│  id                     │     │  id                           │
│  station_stream_id      │     │  station_stream_id            │
│  measured_at (timestamptz)    │  date                         │
│  value                  │     │  value                        │
└─────────────────────────┘     └───────────────────────────────┘
```

### 2.1 `station_streams`

| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | |
| uuid | uuid | Public identifier |
| source_id | bigint FK | EEA or EPA |
| stream_configuration_id | bigint FK | Canonical config (PM2.5 µg/m³, NO2 ppb, Ozone ppb) |
| external_ref | string | Sampling point ID from source |
| location | geometry(4326) | Station coordinates |
| time_zone | string | IANA time zone |
| title | string | Display name |
| url_token | string | Short URL token |
| first_measured_at | timestamptz | |
| last_measured_at | timestamptz | |

Unique constraint: `(source_id, stream_configuration_id, external_ref)`

### 2.2 `station_measurements`

| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | |
| station_stream_id | bigint FK | |
| measured_at | timestamptz NOT NULL | |
| value | float NOT NULL | Canonical unit |

Unique constraint: `(station_stream_id, measured_at)`

### 2.3 `station_stream_daily_averages`

Pre-computed daily aggregates. Calculated by `UpdateStationStreamDailyAveragesWorker` (cron).

| Column | Type | Description |
|--------|------|-------------|
| station_stream_id | bigint FK | |
| date | date | |
| value | integer | Rounded daily average |

Unique constraint: `(station_stream_id, date)`

### 2.4 `sources` and `stream_configurations`

Shared by both old and new models.

**Sources:** `EEA`, `EPA` (AirBeam to be added later).

**Stream configurations** define pollutant display rules. `canonical = true` configurations are used for all storage and map display (canonical units: PM2.5 µg/m³, NO2 ppb, Ozone ppb).

---

## 3. Legacy / Intermediate Models

### 3.1 Legacy model (still read by frontend)

```
users ──< sessions ──< streams ──< fixed_measurements
                              └──< stream_daily_averages
                              └──< stream_hourly_averages (AirBeam only)
                              └──> last_hourly_average_id (AirBeam map pin value)
```

Still written by:
- Government data: `GovernmentSources::FixedStreamsCreator` creates `FixedSession` + `Stream` per station (legacy path in dual-write)
- AirBeam fixed sync: `FixedStreaming::Interactor` → `StreamCreator` (creates `Stream`) → `FixedMeasurementsCreator` (writes `FixedMeasurement` via `stream_id`)
- AirNow (EPA): `AirNowStreaming::Interactor` → `StreamsCreator` / `StreamsUpdater`

Still read by:
- Government map pins (`GET /api/fixed/active/sessions/index2`, sensor_name=government-*): `FixedSessions::IndexInteractor` → `SessionsRepository#fixed_active_government_sessions`
- AirBeam map pins (`GET /api/fixed/active/sessions/index2`, sensor_name=airbeam-*): `Api::ToActiveSessionsJson` (separate query path)
- AirBeam + gov stream detail (`GET /api/v3/fixed_streams/:id`): `FixedStreams::ShowInteractor` → `StreamsRepository` (reads `streams`) + `FixedMeasurementsRepository#last_2_days` (reads `fixed_measurements` via `stream_id`) + `StreamDailyAveragesRepository`
- AirBeam measurement chart (`GET /api/v3/fixed_measurements`): `FixedMeasurements::IndexInteractor` → `FixedMeasurementsRepository#filter` (reads `fixed_measurements` via `stream_id`)

### 3.2 `fixed_streams`

`fixed_streams` has a dual role:

**Current role (government, legacy bridge):** EEA sampling points are registered here by `GovernmentSources::FixedStreamsCreator`. `Eea::MeasurementsLoader` (legacy dual-write path) joins through this table to resolve `stream_id` and write `fixed_measurements`. The `stream_id` column is the legacy bridge.

**Future role (AirBeam fixed sessions, target):** AirBeam fixed sessions (device mounted on a roof, streaming continuously) will migrate from the `sessions/streams` model to `fixed_streams → fixed_measurements (via fixed_stream_id)`. The `fixed_streams` table will then hold AirBeam station metadata (`device_id`, `user_id`, `external_ref` = session UUID).

So `fixed_streams` is **not being dropped**. After government data migrates to `station_streams`, the EEA/EPA rows and `stream_id` column will be removed, and `fixed_streams` will remain as the home for AirBeam fixed sessions.

The `DataFixes::EeaDataMigrator` and `DataFixes::EpaDataMigrator` were one-time scripts that copied data from `fixed_streams` → `station_streams` (and `fixed_measurements` → `station_measurements`).

### 3.3 `fixed_measurements`

Shared measurement storage for AirBeam, EEA, and EPA AirNow (all via `stream_id`). Three write paths:
- **AirBeam** (current): written via `stream_id` by `FixedMeasurementsCreator` in `FixedStreaming::Interactor`
- **EEA legacy** (dual-write): written via `stream_id` by `Eea::MeasurementsLoader`
- **EPA AirNow legacy**: written via `stream_id` by `AirNowStreaming::StreamsUpdater#import_fixed_measurements`

Read by `FixedStreams::ShowInteractor` (stream detail) and `FixedMeasurements::IndexInteractor` (measurement chart), both querying via `stream_id`.

The `fixed_stream_id` + `measured_at` columns exist for the new write path but are only populated by the EEA new path (`Eea::Measurements::Loader`). Once AirBeam fixed sessions migrate to `fixed_streams`, they will write via `fixed_stream_id` instead.

### 3.4 `hourly_averages`

Pre-computed hourly averages linked to `fixed_streams` (EEA only). Used by the legacy map reading path (`SessionsRepository#fixed_active_government_sessions` JOINs this table for EEA government sessions). Will be dropped with the rest of the legacy path.

---

## 4. ETL Pipeline: EEA

Triggered every ~24 minutes by cron (`16,40 * * * *`). One `EeaIngestBatch` record is created per country × pollutant × time window.

```
Cron
 │
 ▼
Eea::TriggerIngestWorker
 └─► Eea::IngestOrchestrator
      └─► creates EeaIngestBatch (country, pollutant, window)
           └─► Eea::DownloadZipWorker
                └─► Eea::Measurements::Extract::ZipDownloader
                     │  fetches zip from EEA API → disk
                     └─► Eea::UnzipWorker
                          └─► Eea::Measurements::Extract::Unzipper
                               │  extracts .parquet files → disk
                               └─► Eea::CopyRawMeasurementsWorker
                                    └─► Eea::Measurements::Extract::Copier
                                         │  DuckDB reads parquet → COPY INTO eea_raw_measurements
                                         └─► Eea::TransformMeasurementsWorker
                                              └─► Eea::Measurements::Transformer
                                                   │  SQL: eea_raw_measurements
                                                   │    → eea_transformed_measurements
                                                   │    (normalize external_ref, convert units,
                                                   │     map pollutant codes → types)
                                                   └─► Eea::LoadMeasurementsWorker
                                                        │
                                              ┌─────────┴──────────────┐
                                              │  DUAL WRITE            │
                                              ▼                        ▼
                                   Eea::MeasurementsLoader    Eea::Measurements::Loader
                                   (LEGACY)                   (NEW)
                                   ┌──────────────────┐       ┌──────────────────────┐
                                   │ eea_transformed  │       │ eea_transformed      │
                                   │  → fixed_streams │       │  → station_streams   │
                                   │  → fixed_        │       │  → station_          │
                                   │    measurements  │       │    measurements      │
                                   │  → sessions      │       │  (timestamps updated │
                                   │    (timestamps)  │       │   on station_streams)│
                                   └──────────────────┘       └──────────────────────┘
```

**Staging tables** (`eea_raw_measurements`, `eea_transformed_measurements`) are batch-scoped and purged after load (`Eea::BatchCleanup`).

**EEA station registration** is separate from the measurement pipeline. Stations are registered via `Eea::SamplingPoints::Interactor` which calls `GovernmentSources::FixedStreamsCreator` (creates legacy `FixedSession`/`Stream`/`FixedStream`) and `GovernmentSources::StationStreamsCreator` (creates `StationStream`).

---

## 5. ETL Pipeline: EPA (AirNow)

Two independent pipelines run in parallel — legacy and new — with no shared dual-write coordination (unlike EEA).

### 5.1 New pipeline (station_streams)

Like EEA, the new EPA pipeline uses staging tables (`epa_raw_measurements`, `epa_transformed_measurements`). The orchestrator processes a 24-hour window hour by hour, with extract and transform running per-hour in parallel, and load triggered only when all hours are complete.

#### Station registration (separate cron)

```
Cron
 │
 ▼
Epa::ImportStationsWorker
 └─► Epa::Stations::Interactor
      │  Epa::ApiClient#fetch_locations
      │  Epa::Stations::DataParser      ─► parses pipe-delimited location data
      │  GovernmentSources::StationFilter    ─► filters to EPA-relevant stations
      │  GovernmentSources::StationEnricher  ─► adds time_zone, stream_configuration_id
      └─► GovernmentSources::StationStreamsCreator
               └─► upserts station_streams (by source_id + stream_configuration_id + external_ref)
```

#### Measurement ingest (separate cron, runs hourly)

```
Cron
 │
 ▼
Epa::TriggerIngestWorker
 └─► Epa::OrchestrateIngestWorker
      └─► Epa::IngestOrchestrator
           │  creates EpaIngestCycle (window: last 24 hours)
           │  creates 24 EpaLoadBatches for the cycle (one will load all hours)
           │  creates 24 EpaStagingBatches (one per hour in the window)
           │
           └─► Epa::StagingBatchDispatcher × 24   (one per hour)
                └─► Epa::ExtractWorker (async, per staging batch)
                     └─► Epa::Measurements::Extractor
                          │  ApiClient#fetch_hourly_data(measured_at:)
                          │    → AirNow pipe-delimited hourly API
                          │    → filters to PM2.5, NO2, O3/OZONE
                          │  inserts into epa_raw_measurements
                          │  marks staging batch :extracted
                          └─► Epa::TransformWorker (async, per staging batch)
                               └─► Epa::Measurements::Transformer
                                    │  reads epa_raw_measurements for batch
                                    │  normalizes: timestamp (date+time → UTC +1h),
                                    │    measurement_type (OZONE/O3 → Ozone, etc.), value
                                    │  upserts into epa_transformed_measurements
                                    │  marks staging batch :completed
                                    │
                                    │  try_start_loading(cycle_id)
                                    │    ← waits until ALL 24 staging batches complete
                                    │
                                    └─► Epa::LoadMeasurementsWorker × N (async, per load batch)
                                         └─► Epa::Measurements::Loader
                                              │  loadable_measurements_data:
                                              │    JOIN epa_transformed_measurements
                                              │         → station_streams (on external_ref)
                                              │  GovernmentSources::MeasurementsUpserter
                                              │    → upserts station_measurements
                                              │  GovernmentSources::StationStreamTimestampsUpdater
                                              │    → updates station_streams.last_measured_at
                                              │  marks load batch :completed
                                              └─► try_complete_cycle → marks EpaIngestCycle :completed
```

### 5.2 Legacy pipeline (sessions/streams/fixed_measurements)

Runs independently. No coordination with the new pipeline.

```
Cron
 │
 ▼
AirNowImportWorker
 └─► AirNowStreaming::Interactor
      │  AirNowStreaming::DataImporter  ─► fetches + parses AirNow API (pipe-delimited)
      │
      ├─► (existing stations) AirNowStreaming::StreamsUpdater
      │         updates Stream.average_value
      │         inserts fixed_measurements (via stream_id)
      │
      └─► (new stations) AirNowStreaming::StreamsCreator
                creates FixedSession + Stream
                inserts fixed_measurements (via stream_id)
```

---

## 6. Reading Switch Plan

The frontend currently reads government data exclusively from the legacy model. The switch happens endpoint by endpoint.

### 6.0 Dual-write consistency verification

Before switching reads, verify that both write paths are producing consistent data.

A `DualWriteCheckWorker` (see [app/workers/dual_write_check_worker.rb](../app/workers/dual_write_check_worker.rb)) runs hourly via `config/sidekiq.yml` and appends one row to `log/dual_write_check.csv`:

| Column | Description |
|--------|-------------|
| DateTime | When the check ran (ISO 8601) |
| EPA legacy ingested no | `fixed_measurements.created_at` in window, joined to `'US EPA AirNow'` user |
| EPA new ingested no | `station_measurements.created_at` in window, joined to `'EPA'` source |
| EPA last legacy measurement | MAX `time_with_time_zone` across all EPA legacy measurements |
| EPA last new measurement | MAX `measured_at` across all EPA new measurements |
| EEA legacy ingested no | Same, for `'EEA'` user |
| EEA new ingested no | Same, for `'EEA'` source |
| EEA last legacy measurement | MAX `time_with_time_zone` for EEA legacy |
| EEA last new measurement | MAX `measured_at` for EEA new |

**Window:** `(now - 2h, now - 1h]` checked by `created_at`. The closed 1-hour window avoids the race condition where measurements being ingested mid-check would inflate counts inconsistently between the two paths.

After a few days, look for:
- **Count ratio** close to 1:1 per source (large divergences indicate a pipeline problem)
- **Freshness lag** (`last legacy` vs `last new`) consistently within one ingest cycle (~30–60 min)

### 6.1 Map pins (active sessions list) — PR #1161

`GET /api/fixed/active/sessions/index2` with `sensor_name: government-*`

**Now:** `FixedSessions::IndexInteractor` → `SessionsRepository` → joins `sessions`, `streams`, `hourly_averages`

**After PR #1161:** `StationStreams::IndexInteractor` → `StationStreamsRepository` → queries `station_streams` + last `station_measurement` via JOIN on `last_measured_at`

Prerequisite: dual-write must be confirmed stable (both models have consistent data).

### 6.2 Single stream detail page — to be done separately

`GET /api/v3/fixed_streams/:id`

Currently used by both government stations and AirBeam fixed sessions. `FixedStreams::ShowInteractor` reads `streams` + `fixed_measurements` (via `stream_id`) + `stream_daily_averages`.

**Government path:** needs a new interactor reading `station_streams` / `station_measurements` / `station_stream_daily_averages`. The `:id` in the URL currently refers to `streams.id`; will need to be `station_streams.id` (routing change or redirect).

**AirBeam path:** will continue using `FixedStreams::ShowInteractor` for now; switches to reading via `fixed_stream_id` when AirBeam fixed sessions migrate to `fixed_streams`.

### 6.3 Timelapse

Currently bypasses `stream_hourly_averages` for EEA and uses raw SQL against `fixed_measurements`. After switch, will need to query `station_measurements`.

### 6.4 AirBeam fixed sessions

Not part of the current government migration. Still write via legacy `FixedStreaming::Interactor` → `sessions/streams/fixed_measurements (stream_id)`. Will eventually migrate to `fixed_streams → fixed_measurements (fixed_stream_id)` — see section 7.3.

---

## 7. Cleanup Plan

Once all reading endpoints have been switched to the new model:

### 7.1 Code

| What | Where | Action |
|------|-------|--------|
| Legacy EEA write path | `Eea::MeasurementsLoader` | Remove |
| Legacy EEA dual-write call | `Eea::LoadMeasurementsWorker` | Remove `Eea::MeasurementsLoader.new.call` |
| Legacy station creation | `GovernmentSources::FixedStreamsCreator` | Remove `create_sessions`, `create_streams` methods |
| Legacy stream defaults | `GovernmentSources::StreamDefaults` | Remove |
| Legacy government reading | `FixedSessions::IndexInteractor` | Remove (or keep for AirBeam) |
| Legacy repository queries | `SessionsRepository#fixed_active_government_sessions` | Remove |
| Data migrators | `DataFixes::EeaDataMigrator`, `DataFixes::EpaDataMigrator` | Remove (one-time scripts) |

### 7.2 Database (government data only)

| What | Action |
|------|--------|
| `fixed_streams` EEA/EPA rows | Delete rows where `source_id` = EEA or EPA (table stays — will hold AirBeam fixed sessions) |
| `fixed_streams.stream_id` column | Drop after EEA/EPA rows removed (legacy bridge, not needed for AirBeam) |
| `fixed_measurements` EEA/EPA rows | Delete rows linked to removed EEA/EPA `fixed_streams` |
| `hourly_averages` | Drop table (EEA-only aggregation, linked to `fixed_streams.stream_id`) |
| `sessions` / `streams` (EEA/EPA rows) | Delete rows owned by `EEA` / `US EPA AirNow` users |
| `stream_daily_averages` (EEA/EPA rows) | Delete rows linked to removed streams |
| `stream_hourly_averages` (EEA rows) | Delete EEA rows (AirBeam rows stay until AirBeam migrates to `fixed_streams`) |

### 7.3 Future: AirBeam migration

**Two types of AirBeam sessions — different futures:**

| Type | Description | Future plan |
|------|-------------|-------------|
| **Mobile sessions** | Created all at once when session completes, short recordings | Keep on legacy `sessions → streams → measurements` model |
| **Fixed sessions** | AirBeam mounted on roof, streams continuously for months | Migrate to `fixed_streams → fixed_measurements (fixed_stream_id)` |

Mobile sessions are not being migrated. Fixed sessions are the focus of this section.

#### Target model for AirBeam fixed sessions: `fixed_streams`

`fixed_streams` already has the right shape (`external_ref`, `location`, `time_zone`, `title`, `url_token`). It needs two additional columns to support AirBeam:
- `device_id` (FK → `devices`) — which physical AirBeam produced this stream
- `user_id` (FK → `users`) — who created this recording session

`external_ref` = session UUID from the mobile app, which groups all sensor streams (PM2.5, PM10, humidity, etc.) for one session.

#### `devices` table (not yet implemented)

Needed to track physical hardware by MAC address. Powers a "see all sessions recorded by this device" feature — useful in the mobile app (borrow a device, switch accounts, etc.).

| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | |
| mac_address | string UNIQUE NOT NULL | Physical device identifier |
| model | string NOT NULL | "AirBeam2", "AirBeam3", etc. |

`fixed_streams.device_id` + `user_id` enable queries like:
- All sensor streams in one session: `WHERE external_ref = :session_uuid`
- All sessions recorded by this device: `WHERE device_id = :device_id`
- All fixed sessions by this user: `WHERE user_id = :user_id`

#### Migration steps

1. Create `devices` table; populate from existing `sessions` / `streams` data
2. Add `device_id`, `user_id` columns to `fixed_streams`
3. Add `AirBeam` to `sources`; add AirBeam sensor configs to `stream_configurations`
4. Migrate existing fixed AirBeam `sessions → streams` data to `fixed_streams`
5. Migrate `fixed_measurements (stream_id)` → `fixed_measurements (fixed_stream_id)` for AirBeam rows
6. Update `FixedStreaming::Interactor` to create `FixedStream` records and write via `fixed_stream_id`
7. Update `FixedStreams::ShowInteractor` and `FixedMeasurements::IndexInteractor` to query via `fixed_stream_id`
8. Delete AirBeam `sessions/streams` rows; drop the `fixed_measurements.stream_id` column

---

## 8. Reference: Stream Configurations

All government data is stored in **canonical** units.

| Measurement Type | Canonical Unit | Very Low | Low | Medium | High | Very High |
|-----------------|---------------|----------|-----|--------|------|-----------|
| PM2.5 | µg/m³ | 0 | 9 | 35 | 55 | 150 |
| NO2 | ppb | 0 | 53 | 100 | 360 | 649 |
| Ozone | ppb | 0 | 59 | 75 | 95 | 115 |

EEA source data arrives in µg/m³ for NO2 and Ozone; conversion to ppb happens in `Eea::Measurements::Transformer` before storage.

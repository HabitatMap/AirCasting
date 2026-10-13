# Government Sources ETL: Concepts & Integration Guide

This document describes the ETL (Extract, Transform, Load) ingestion process used for government air quality data sources. It covers the conceptual model, data flow, shared infrastructure, and a step-by-step template for adding new integrations.

Currently implemented sources: **EEA** (European Environment Agency) and **EPA** (US Environmental Protection Agency via AirNow).

---

## Table of Contents

1. [Domain Model](#1-domain-model)
2. [ETL Overview](#2-etl-overview)
3. [Temporary Tables](#3-temporary-tables)
4. [Destination Tables](#4-destination-tables)
5. [Flow Control Objects](#5-flow-control-objects)
6. [EEA Implementation](#6-eea-implementation)
7. [EPA Implementation](#7-epa-implementation)
8. [Shared GovernmentSources Infrastructure](#8-shared-governmentsources-infrastructure)
9. [Station Import](#9-station-import)
10. [Template: Adding a New Source](#10-template-adding-a-new-source)

---

## 1. Domain Model

### Station Stream

A **station stream** (`station_streams`) represents a single measurement channel from a fixed monitoring station. It captures **one measurement type** (e.g., PM2.5) from **one station**.

A physical monitoring station may report multiple pollutants, but each measurement type gets its own station stream. This is a deliberate design choice: different pollutants from the same station are often reported with different time ranges and availability. Separating them prevents one pollutant's gaps from affecting another's lifecycle.

Each station stream holds:
- `source_id` — which source this stream belongs to (EEA or EPA)
- `stream_configuration_id` — which measurement type and unit
- `external_ref` — the source's identifier for the stream (sampling point ID for EEA, AirNow `StationID` for EPA — the id HourlyData reports under)
- `location` — geographic position (PostGIS point, SRID 4326)
- `time_zone` — IANA time zone (e.g., `"Europe/Warsaw"`)
- `first_measured_at` / `last_measured_at` — aggregate time bounds, kept up-to-date after each ingestion batch
- `title`, `url_token` — display and URL fields
- `station_id` — the station this stream comes off. Set by the EPA station import; nullable, because EEA streams and EPA streams missing from the V2 site list have no station yet

**Unique constraint:** `(source_id, stream_configuration_id, external_ref)` — this prevents duplicate streams and is the key the station import matches incoming rows on.

### Station

A **station** (`stations`) is the physical monitoring site that station streams come off. One station has one stream per measurement type it reports, and occasionally more than one (several EEA sampling points for one pollutant).

Each station holds:
- `source_id` — EEA or EPA
- `external_ref` — the source's own site key: EPA `FullAQSID` from `Monitoring_Site_Locations_V2.dat`, EEA `Air Quality Station EoI Code`. Unique per source.
- `title`, `location`, `time_zone` — the site's attributes
- `excluded_reason` — why the station is hidden from the map, or NULL if shown

**Excluded reasons.** An excluded station keeps its streams and keeps ingesting measurements; it is only left out of the map endpoints that read `station_streams` (web and older mobile apps). The allowed values are `Station::EXCLUDED_REASONS`:

| Reason | Meaning |
|---|---|
| `temporary` | EPA `MonitorType` is `Temporary`: a portable unit that keeps its id while it moves between deployments, so its coordinates do not describe a fixed site |
| `no_coordinates` | The source publishes no real position for the site (0,0 or 90,0) |

There is no DB check constraint on the column, so adding a reason needs no migration: add it to the constant and to this table. Station imports write with `upsert_all`, which skips model validations, so always set the value through the constant.

### Station Measurements

**Station measurements** (`station_measurements`) are the individual hourly data points for a stream. Government sources report data at hourly granularity, so each row represents the value measured in a given hour.

Each row holds:
- `station_stream_id`
- `measured_at` — timestamp (UTC)
- `value` — the measured value in canonical units

**Unique constraint:** `(station_stream_id, measured_at)` — there is exactly one measurement per stream per hour.

### Station Stream Daily Averages

**Daily averages** (`station_stream_daily_averages`) are pre-computed day-level aggregates of station measurements. They are used for calendar views and historical charts in the UI.

Each row holds:
- `station_stream_id`
- `date` — the calendar date (in the stream's local time zone)
- `value` — rounded integer average of all hourly measurements for that day

**Unique constraint:** `(station_stream_id, date)`.

---

## 2. ETL Overview

The ingestion process is divided into three phases:

```
┌──────────────────────────────────────────────────────────────────────┐
│                         INGESTION PROCESS                            │
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │   EXTRACT   │───>│  TRANSFORM  │───>│          LOAD           │  │
│  │             │    │             │    │                         │  │
│  │ Fetch from  │    │ Normalize   │    │ Upsert to               │  │
│  │ source API  │    │ Deduplicate │    │ station_measurements    │  │
│  │             │    │             │    │ Update stream timestamps│  │
│  │ → raw table │    │ → transform │    │                         │  │
│  │             │    │   table     │    │                         │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Extract

Fetches data from the third-party source API and writes it verbatim (or near-verbatim) into the **raw measurements** table. The data shape closely mirrors what the API returns: same column names, same types. Only minimal filtering is applied at this stage — for example, discarding records with invalid validity flags or unsupported measurement types. No value transformations happen here.

This design makes raw measurements a direct record of what was received from the source, which is valuable for debugging.

### Transform

Reads raw measurements, applies all necessary normalizations, and writes the result into the **transformed measurements** table. This step:

- Renames columns to match internal conventions (e.g., maps source-specific field names to `external_ref`, `measured_at`, `value`, `unit_symbol`)
- Converts values to canonical units (e.g., EEA reports NO2 in µg/m³ which is converted to ppb)
- Normalizes measurement type names (e.g., `O3`/`OZONE` → `Ozone`)
- **Deduplicates** records: the transformed table has a unique constraint on `(external_ref, measurement_type, measured_at)`, enforced at the database level via `ON CONFLICT DO UPDATE`. Since ingestion windows overlap (we always fetch a wider range to catch late-arriving data), the same measurement will often appear in multiple batches; this step ensures only one record per time slot per station survives.

### Load

Reads transformed measurements and upserts them into `station_measurements`. This step:

- Joins transformed measurements with `station_streams` to resolve `station_stream_id`
- Upserts records into `station_measurements` (unique on `station_stream_id, measured_at`)
- Updates `first_measured_at` and `last_measured_at` on each affected station stream

Because deduplication already happened in the transform step, the load step is straightforward. The uniqueness constraint on `station_measurements` is a final safety net, not the primary deduplication mechanism.

### Eventual Consistency

The ingestion is designed to be **eventually consistent**. Each source's ingestion runs approximately every 30 minutes. If a run fails or data arrives late, the next run will capture it — no manual retries are needed. The overlapping fetch windows ensure that data not captured in one run will be picked up in the next.

---

## 3. Temporary Tables

Each source has two dedicated temporary tables: one for raw data and one for transformed data. These tables are purged regularly (e.g., after 7 days for EEA) and remain small relative to `station_measurements`.

### Raw Measurements Table

**Purpose:** Stores data exactly as received from the source.

**Properties:**
- **UNLOGGED** — no WAL writes, making bulk inserts fast
- **No primary key** — further reduces insert overhead
- **No foreign keys** — allows inserts to succeed independently of other tables
- **Indexed** on batch reference and `ingested_at` — supports efficient querying during the transform step

**What it looks like:** Column names, types, and values match the source API output. For example, `eea_raw_measurements` has columns like `samplingpoint`, `pollutant` (integer code), `validity` (integer flag). `epa_raw_measurements` has `aqsid`, `parameter_name`, `valid_date`, `valid_time`.

Looking at the raw table for a source gives you immediate insight into the shape and content of data being received — useful for debugging.

### Transformed Measurements Table

**Purpose:** Stores normalized data ready for loading into `station_measurements`.

**Properties:**
- Has a primary key
- Has a unique constraint on `(external_ref, measurement_type, measured_at)` — enforces deduplication
- Linked to the batch/staging batch via foreign key
- Column names match internal conventions

**What it looks like:** All transformed tables share the same logical schema:
```
external_ref       string   -- source's station identifier
measurement_type   string   -- "PM2.5", "Ozone", or "NO2"
measured_at        timestamptz
value              float    -- in canonical units
unit_symbol        string
ingested_at        timestamptz
```

---

## 4. Destination Tables

The destination tables are the authoritative store for air quality data served to users. All government sources write to the same shared tables, which is what allows the map and other features to display data uniformly regardless of source.

### station_measurements

- Unique on `(station_stream_id, measured_at)`
- `value` is updated if a record is re-inserted (late corrections from sources)

### station_streams

- Updated after each load batch: `first_measured_at` and `last_measured_at` reflect the actual range of data in `station_measurements`
- Timestamp updates only extend the range — they never shrink it based on a single batch
- The EPA station import may rewrite `station_id`, `location` and `time_zone` of an existing stream (see [Section 9](#9-station-import)); it never rewrites `url_token`
- `updated_at` moves whenever a row really changes — new measurements or a station import update — and is what the daily-average calculator selects on

### station_stream_daily_averages

- Recalculated for streams updated within the last hour (last 2 days only)
- Grouped by the stream's local time zone (so "2025-01-15" means January 15 in the station's local time)
- Values are rounded integers
- When a stream's time zone changes, its whole history is deleted and recomputed in the new zone by `RebuildStationStreamDailyAveragesWorker` — every day boundary moves, and a date that existed only under the old zone would otherwise keep a stale value

---

## 5. Flow Control Objects

Each source uses batch/cycle objects to track the state of an ingestion run and coordinate the pipeline workers.

### EEA: Ingest Batch

`EeaIngestBatch` is the unit of work for EEA. Each batch is identified by:
```
(country, pollutant, window_starts_at, window_ends_at)
```

Status flow:
```
queued → downloaded → unzipped → copied → transformed → saved → completed
                                                                ↘ failed
```

Batches are created by the orchestrator and processed independently. There are no cross-batch dependencies — 108 batches (36 countries × 3 pollutants) run in parallel.

### EPA: Ingest Cycle, Staging Batches, and Load Batches

EPA uses a three-level hierarchy because hourly data files must all be fetched before loading can begin:

**`EpaIngestCycle`** — the top-level object representing a 24-hour ingestion window.
```
staging → loading → completed
                  ↘ failed
```

**`EpaStagingBatch`** — one per hour in the cycle (24 total). Tracks extraction and transformation of one hour's data file.
```
queued → extracted → completed
                   ↘ failed
```

**`EpaLoadBatch`** — one per measurement type (3 total: PM2.5, Ozone, NO2). Created at the start of the cycle; triggered once all staging batches are complete.
```
queued → completed
       ↘ failed
```

Transitions are guarded by database-level checks: `try_start_loading` only moves the cycle to `loading` when all staging batches have reached `completed`; `try_complete_cycle` only marks the cycle `completed` when all load batches are done.

---

## 6. EEA Implementation

### Data Source

EEA data is downloaded as **zipped Parquet files** from the EEA Azure API endpoint. Each request is scoped by country, pollutant, and time window.

### Measurement Types

`PM2.5`, `NO2`, `Ozone` (identified by integer pollutant codes in raw data).

### Pipeline Workers

```
TriggerImportWorker (scheduled)
  └─ OrchestrateIngestWorker
       For each (country × pollutant):
         └─ DownloadZipWorker        → status: downloaded
              └─ UnzipWorker         → status: unzipped
                   └─ CopyRawMeasurementsWorker  → status: copied
                        └─ TransformMeasurementsWorker  → status: transformed
                             └─ LoadMeasurementsWorker  → status: saved
                                  └─ CleanupBatchWorker → status: completed
```

An independent `PurgeMeasurementsWorker` deletes raw and transformed records older than 7 days.

### Key Transformations

- Pollutant code → measurement type string (e.g., `8` → `"NO2"`)
- Sampling point URL → `external_ref` (ID extracted from URL)
- Unit conversions to canonical ppb:
  - Ozone: `value / 1.96`
  - NO2: `value / 1.88`
  - PM2.5: no conversion (already µg/m³)

### Batch Parameters

- **Window:** 6 hours lookback + 1 day (accounts for delays in data availability across countries)
- **Frequency:** Runs twice per hour
- **Scope:** 36 countries × 3 pollutants = up to 108 concurrent batches

---

## 7. EPA Implementation

### Data Source

EPA data is fetched as **pipe-delimited flat files** from S3 (AirNow). Each file covers one hour of measurements for all US stations.

### Measurement Types

`PM2.5`, `Ozone`, `NO2` (raw data uses `O3`/`OZONE`/`PM2.5`/`NO2` strings).

### Pipeline Workers

```
TriggerIngestWorker (scheduled)
  └─ OrchestrateIngestWorker
       Creates EpaIngestCycle (24-hour window)
       Creates EpaLoadBatches (one per measurement type)
       For each hour (24 total):
         └─ ExtractWorker         → staging batch: extracted
              └─ TransformWorker  → staging batch: completed
                   (when ALL staging batches complete)
                     └─ LoadMeasurementsWorker (per measurement type)
                          → load batch: completed
                            (when ALL load batches complete)
                              → cycle: completed
```

### Key Transformations

- AQSID → `external_ref`
- `O3`/`OZONE` → `"Ozone"`; others kept as-is
- Timestamp normalization: raw timestamps are end-of-hour, stored as the hour they represent (+1 hour added)
- Value parsed with null-safe float conversion

### Cycle Parameters

- **Window:** 24 hours ending at `now.beginning_of_hour - 1 hour`
- **Frequency:** Runs approximately every 30 minutes
- **Scope:** 24 staging batches per cycle, 3 load batches per cycle

---

## 8. Shared GovernmentSources Infrastructure

The `GovernmentSources` module (under `app/services/government_sources/`) contains all logic shared between sources.

### MeasurementsUpserter

Converts transformed measurements to `station_measurements` records and upserts them. Uses `ON CONFLICT (station_stream_id, measured_at) DO UPDATE SET value = excluded.value`.

### StationStreamTimestampsUpdater

Computes `MIN(measured_at)` and `MAX(measured_at)` from the current batch and bulk-updates `first_measured_at` / `last_measured_at` on affected station streams. Uses `LEAST`/`GREATEST` with `COALESCE` so updates only extend (never shrink) the recorded time range.

### StationStreamDailyAveragesCalculator

Recalculates daily averages for streams updated within the last hour. Groups by the stream's time zone to ensure dates align with local calendar days.

### StationStreamDailyAveragesRebuilder

Deletes and recomputes the full daily-average history (from `first_measured_at`) of the given streams, in one transaction per time zone. Run by `RebuildStationStreamDailyAveragesWorker` (`slow` queue, gated by `sidekiq_averages_calculation_enabled`), which `StationStreamsUpdater` enqueues for streams whose time zone changed.

### Station import components

Used during station import (see [Section 9](#9-station-import)). The unit passed between them is `GovernmentSources::StationStreamRow`: one stream (one pollutant at one site) as the source's site list describes it, before it is written. Its `station_*` fields describe the site it belongs to. Inside the module, refer to the model as `::Station`.

- **StationsUpserter** — groups incoming streams by site, upserts one `stations` row per site (only sites that changed), then hands every stream its station's id, point and time zone. The time zone is looked up only for a new site or a moved one; a point with no zone (at sea) falls back to `UTC`
- **StationStreamsUpdater** — writes `station_id`, `location`, `time_zone` and `title` to existing streams in batched UPDATEs, only for rows that changed. A row whose site name is blank or a placeholder (`N/A`, `Unknown`) carries its `external_ref` as the title; that never replaces the title a stream already has. Never touches `url_token`. Logs moves over 1 km and enqueues the daily-average rebuild for streams whose time zone changed
- **StationStreamFilter** — skips rows whose stream already exists, so only new ones go on
- **StationStreamEnricher** — adds derived fields: PostGIS location and IANA time zone (via `TimeZoneFinderWrapper`) unless `StationsUpserter` already set them, `source_id`, `stream_configuration_id`, `url_token`
- **StationStreamsCreator** — inserts new `station_streams` (`insert_all`, conflicts skipped); an existing row is never overwritten from here

Deduplication of incoming rows happens earlier, in the parser (`GovernmentSources::StationStreamRows.deduplicate`). Point helpers (`real_position?`, `same_point?`, `distance_m`) live on `GovernmentSources` itself.

---

## 9. Station Import

Before measurements can be loaded, the corresponding `station_streams` records must exist. Each source has a stations import step that runs separately from the measurement ingestion pipeline.

The mechanics of importing differ per source:

| Source | Method |
|--------|--------|
| EEA | CSV files bundled with the application (`app/services/eea/stations/data/`) |
| EPA | AirNow S3 file `Monitoring_Site_Locations_V2.dat`, fetched hourly at `:20` by `Epa::ImportStationsWorker` |

The EEA files are an extract of the EEA Table publisher dataset
`Airquality_Dissem.b2g.measurements`, taken 2026-02-02..04 (#1122). Which
download filters were used is not recorded. A fresh extract is a zip holding
one `DataExtract.csv` covering every pollutant:

```sh
curl -L -o extract.zip \
  'https://discomap.eea.europa.eu/App/AQViewer/download?fqn=Airquality_Dissem.b2g.measurements&f=csv'
```

Split it on `Air Pollutant` (`NO2` / `O3` / `PM2.5`) to get the three bundled
file names. Note that both readers glob `data/*.csv` non-recursively, so a new
extract replaces the bundled files rather than sitting beside them — dated
snapshots are kept one level down in `data/snapshots/`, see the README there.

### EPA

```
Epa::Stations::DataParser (V2 rows → GovernmentSources::StationStreamRow, deduplicated)
  └─ StationsUpserter (stations rows; station id, point, zone onto every stream)
       ├─ StationStreamsUpdater (existing streams: station_id, location, time_zone, title)
       └─ StationStreamFilter (new streams only)
            └─ StationStreamEnricher (source config, url_token)
                 └─ StationStreamsCreator (insert station_streams with station_id)
```

Rules:
- **Keys.** A stream's `external_ref` is V2 `StationID`, the id HourlyData reports under. A station's `external_ref` is V2 `FullAQSID`; one `StationID` always belongs to one `FullAQSID`, and every row of one `FullAQSID` carries the same name, point and monitor type.
- **Everything in V2 is imported.** EPA support describes V2 as the complete site list, so streams are created for every supported row, including sites that are not reporting right now. A stream that never reports gets no measurements and is never shown on the web map, which requires `last_measured_at`.
- **No `Status` filter.** Inactive rows are imported too; activity is decided by our own measurements.
- **Temporary monitors** (`MonitorType` = `Temporary`) are imported and keep ingesting, but their station gets `excluded_reason = temporary`. The import sets `excluded_reason` from `MonitorType` on every run, so a reason set by hand on a site that is still in V2 is overwritten.
- **No position, no row.** A row at 0,0 or 90,0 is dropped before anything is written: no new stream is created there, and an existing stream keeps the point it has.
- **Streams follow their station.** An existing stream takes its station's point and time zone, and its title follows the site name in the site list, so renames and fixed encodings reach existing streams. `url_token` is left alone.
- **Re-running is cheap.** Only changed stations and streams are written; an unchanged file writes nothing.

#### Streams the import leaves without a station

The import links only streams whose ref is in today's V2. Two kinds are left over: streams of sites that have since left V2, and `UNMATCHED-<session uuid>` streams that `DataFixes::EpaDataMigrator` could not key. `rake epa:link_stationless_streams` (`DataFixes::EpaStationlessStreamsLinker`) links them, one-off, against the V2 published on the day each stream last reported (`airnow/YYYY/YYYYMMDD/Monitoring_Site_Locations_V2.dat`, kept from 2023 on). Dry run by default; `APPLY=1` writes, `CACHE_DIR=path` keeps the downloaded files.

- A real ref is matched by ref and measurement type; an `UNMATCHED` stream the migrator's way, by its point rounded to 3 decimals plus measurement type.
- A stream is linked only when every matching row belongs to one station. A station missing from `stations` is created from that day's row.
- An `UNMATCHED` stream that day's V2 leaves unmatched or ambiguous falls back to its legacy session (the uuid in its ref). `AirNowStreaming` created and fed that session from the v1 list (`monitoring_site_locations.dat`), keying each AQSID by the point of its first row rounded to 3 decimals. The v1 list of the day it last fed the session (±1 day, as it reads AirNow's `today` folder), else of the day it created it, must hold exactly one AQSID with that measurement type at the session's point; the V2 of the same day gives the station.
- An `UNMATCHED` stream whose match is a single ref also takes that ref, so ingest feeds it again. A stream for that ref that has never measured anything (the import creates one for every V2 ref) is deleted first; if it has data, the `UNMATCHED` stream is only linked, so its station holds two streams of that type.
- Point, time zone and title are left alone; the import aligns them once the ref is in today's V2.

`rake epa:merge_unmatched_streams` (`DataFixes::EpaUnmatchedStreamsMerger`) then folds each linked `UNMATCHED` stream into the one real-ref stream of its station and measurement type, so a station holds one stream per type. Dry run by default; `APPLY=1` writes, `LIMIT=n` caps the streams merged per run.

- One transaction per stream, `lock_timeout` 5s. Measurements for hours the target already has are dropped (the target's value wins); the rest move to the target. The target's measured range is widened, the `UNMATCHED` stream and its daily averages are deleted, and the target's daily averages are rebuilt.
- The target keeps its id, uuid, url_token, point and time zone. A target over 1 km away is logged as `far=`.
- `HAND_CHECKED` adds streams checked by hand against HourlyData, keyed by ref, as stream ids differ between environments. An entry old ref → new ref merges the old ref's stream into the new ref's stream of the same type, whether or not it has a station: Kent-S 236th `840530330090` → `840530330095` (AirNow re-keyed the site), and EBAM-14's `UNMATCHED` stream → `840MMSC00014`. An entry with `[until, ref]` pairs splits the stream by date instead, each piece into its own ref's stream of the same type: `CC0096625`, the legacy 0,0 bucket, holds St. Pete Midtown `840121030028` hours before 2025-03-01 and Ft. Dodge `840191870013` hours after. A piece without hours needs no target, and the stream is deleted once its pieces are moved, so the never-measured `CC0096625` streams go too. The dry run logs each piece's target, hours moved and dropped, and first and last hour.
- A stream whose station has no stream of its type, or several, is left alone and logged. A lock timeout or a unique violation (ingest wrote the same hour meanwhile) rolls that stream back; it is retried by the next run.

`rake epa:delete_never_measured_streams` (`DataFixes::EpaNeverMeasuredStreamsDeleter`) last deletes the EPA streams that still have no station and were never measured: no measured range, no measurements, no daily averages. They came from the old v1 site list for monitors that never reported and are not in V2 (or sit at 0,0, which the import drops), so the import does not recreate them. A never-measured stream with a station is a V2 monitor and is kept. Dry run by default, logging each stream; `APPLY=1` deletes in one statement that repeats every condition, so a stream ingest writes to meanwhile is kept.

### EEA

EEA's import still goes through the legacy path (`LegacyStationStreamFilter` → `LegacyStationStreamEnricher` → `FixedStreamsCreator`) and does not create `stations` yet.

---

## 10. Template: Adding a New Source

This section describes the components that need to be implemented for a new government source integration.

### Step 1: Database Setup

#### Register the source

Add a seed or migration to create a `Source` record:
```ruby
Source.find_or_create_by!(name: 'NewSource')
```

#### Link measurement types

Create `source_stream_configurations` records linking the new source to the relevant `StreamConfiguration` records (PM2.5, NO2, Ozone — or whichever types the source provides). If the source uses non-canonical units, create new `StreamConfiguration` records first.

#### Raw measurements table

Create an UNLOGGED table that mirrors the shape of data returned by the source API. It should have:
- No primary key
- No foreign keys
- A reference column for the batch/cycle object (e.g., `new_source_batch_id bigint`)
- `ingested_at timestamptz DEFAULT now()`
- Indexes on `ingested_at` and the batch reference column
- All other columns typed to match the source API (strings, floats, timestamps as-is)

```sql
CREATE UNLOGGED TABLE new_source_raw_measurements (
  new_source_batch_id bigint,
  -- source-specific columns matching the API response shape
  station_id          varchar,
  parameter_name      varchar,
  measured_at_raw     varchar,
  value               float,
  unit                varchar,
  validity_flag       integer,
  ingested_at         timestamptz DEFAULT now()
);
CREATE INDEX ON new_source_raw_measurements (new_source_batch_id);
CREATE INDEX ON new_source_raw_measurements (ingested_at);
```

#### Transformed measurements table

```sql
CREATE TABLE new_source_transformed_measurements (
  id                    bigserial PRIMARY KEY,
  new_source_batch_id   bigint NOT NULL REFERENCES new_source_batches(id),
  external_ref          varchar NOT NULL,
  measurement_type      varchar NOT NULL,  -- "PM2.5", "Ozone", or "NO2"
  measured_at           timestamptz NOT NULL,
  value                 float NOT NULL,
  unit_symbol           varchar NOT NULL,
  ingested_at           timestamptz NOT NULL,
  CONSTRAINT new_source_transformed_measurements_unique
    UNIQUE (external_ref, measurement_type, measured_at)
);
CREATE INDEX ON new_source_transformed_measurements (new_source_batch_id);
CREATE INDEX ON new_source_transformed_measurements (ingested_at);
```

### Step 2: Batch / Cycle Model

Create an ActiveRecord model that tracks the state of one unit of work. At minimum it needs:
- Parameters that identify what data to fetch (time window, country, parameter type, etc.)
- A `status` enum covering at least: `queued`, `extracted`, `transformed`, `saved`, `completed`, `failed`
- A unique constraint on the identifying parameters (to prevent duplicate batches for the same data)

```ruby
class NewSourceBatch < ApplicationRecord
  enum :status, {
    queued:      'queued',
    extracted:   'extracted',
    transformed: 'transformed',
    saved:       'saved',
    completed:   'completed',
    failed:      'failed'
  }
end
```

If your source requires a two-level hierarchy (e.g., EPA's cycle → staging batches → load batches), model that explicitly. Otherwise a flat batch model like EEA is sufficient.

### Step 3: API Client

Create `app/services/new_source/api_client.rb`. Responsibilities:
- One method per API endpoint
- Returns raw response body (do not parse here)
- Raises on HTTP errors
- No business logic

### Step 4: Extractor

Create `app/services/new_source/measurements/extractor.rb`. Responsibilities:
- Call the API client
- Parse the response (CSV, JSON, pipe-delimited, Parquet, etc.)
- Filter out unsupported measurement types and invalid/flagged records
- Bulk-insert into the raw measurements table
- Update batch status to `extracted`
- No value transformations

### Step 5: Transformer

Create `app/services/new_source/measurements/transformer.rb`. Responsibilities:
- Read raw measurements for the current batch
- Apply all normalizations:
  - Map source field names to `external_ref`, `measurement_type`, `measured_at`, `value`, `unit_symbol`
  - Normalize measurement type strings to `"PM2.5"`, `"Ozone"`, or `"NO2"`
  - Convert values to canonical units
  - Parse timestamps to UTC
- Upsert to transformed measurements table (`ON CONFLICT DO UPDATE`) — this is where deduplication happens
- Update batch status to `transformed`

### Step 6: Loader

Create `app/services/new_source/measurements/loader.rb`. Responsibilities:
- Query transformed measurements for this batch, join with `station_streams` on `(source_id, stream_configuration_id, external_ref)`
- Call `GovernmentSources::MeasurementsUpserter` to upsert into `station_measurements`
- Call `GovernmentSources::StationStreamTimestampsUpdater` to update stream time bounds
- Update batch status to `saved`/`completed`

### Step 7: Orchestrator

Create `app/services/new_source/ingest_orchestrator.rb`. Responsibilities:
- Determine the fetch window(s)
- Create batch objects
- Enqueue the first worker in the pipeline for each batch
- Handle idempotency (skip batches already in progress)

### Step 8: Workers

Create one Sidekiq worker per pipeline step under `app/workers/new_source/`. Each worker:
- Receives a batch ID
- Instantiates the corresponding service object
- Calls it
- On success, enqueues the next worker
- On failure, updates batch status to `failed` (optionally re-raises for Sidekiq retry)

```ruby
module NewSource
  class ExtractWorker
    include Sidekiq::Worker
    sidekiq_options queue: :new_source

    def perform(batch_id)
      batch = NewSourceBatch.find(batch_id)
      NewSource::Measurements::Extractor.new(batch).call
    end
  end
end
```

Add a trigger worker and schedule it in `config/sidekiq.yml`:
```yaml
scheduler:
  new_source_trigger:
    cron: "*/30 * * * *"
    class: NewSource::TriggerIngestWorker
```

### Step 9: Station Import

Create `app/services/new_source/stations/` with:
- `data_parser.rb` — parses the source-specific station list format and returns an array of `GovernmentSources::StationStreamRow` objects
- `interactor.rb` — orchestrates the station import pipeline using shared components:

```ruby
module NewSource
  module Stations
    class Interactor
      def call(stations_data)
        rows = DataParser.new.call(data: stations_data)

        rows = GovernmentSources::StationStreamFilter.new.call(rows:, source_name: :new_source)
        rows = GovernmentSources::StationStreamEnricher.new.call(rows:, source_name: :new_source)
        GovernmentSources::StationStreamsCreator.new.call(rows:)
      end
    end
  end
end
```

Create a worker (`ImportStationsWorker`) and trigger it as needed (e.g., daily or on first setup).

If the source publishes a site id that groups its streams into stations, set `station_external_ref` in the parser and follow `Epa::Stations::Interactor`, which adds `StationsUpserter` and `StationStreamsUpdater` in front of the filter (see [Section 9](#9-station-import)).

### Step 10: Purger

Create `app/services/new_source/measurements_purger.rb` to delete raw and transformed records older than a defined cutoff (7 days is the EEA default). Schedule it independently of the ingestion pipeline.

### Checklist

```
Database
  [ ] Source record seeded
  [ ] source_stream_configurations linked
  [ ] new_source_batches (or cycle/batch hierarchy) table and model
  [ ] new_source_raw_measurements table (UNLOGGED, no PK, no FKs)
  [ ] new_source_transformed_measurements table (with unique constraint)

Services
  [ ] NewSource::ApiClient
  [ ] NewSource::Measurements::Extractor
  [ ] NewSource::Measurements::Transformer
  [ ] NewSource::Measurements::Loader
  [ ] NewSource::IngestOrchestrator
  [ ] NewSource::MeasurementsPurger
  [ ] NewSource::Stations::DataParser
  [ ] NewSource::Stations::Interactor

Workers
  [ ] NewSource::TriggerIngestWorker
  [ ] NewSource::OrchestrateIngestWorker
  [ ] NewSource::ExtractWorker
  [ ] NewSource::TransformWorker
  [ ] NewSource::LoadMeasurementsWorker
  [ ] NewSource::ImportStationsWorker
  [ ] NewSource::PurgeMeasurementsWorker

Configuration
  [ ] Sidekiq queue :new_source added to config/sidekiq.yml
  [ ] Cron schedule for TriggerIngestWorker
  [ ] Cron schedule for PurgeMeasurementsWorker
  [ ] Any API credentials added to credentials/environment config
```

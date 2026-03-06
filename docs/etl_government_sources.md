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
- `external_ref` — the source's identifier for the station (e.g., sampling point ID for EEA, AQSID for EPA)
- `location` — geographic position (PostGIS point, SRID 4326)
- `time_zone` — IANA time zone (e.g., `"Europe/Warsaw"`)
- `first_measured_at` / `last_measured_at` — aggregate time bounds, kept up-to-date after each ingestion batch
- `title`, `url_token` — display and URL fields

**Unique constraint:** `(source_id, stream_configuration_id, external_ref)` — this prevents duplicate streams and is the key used for upserts during station import.

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

### station_stream_daily_averages

- Recalculated for streams that received new measurements within the last hour
- Grouped by the stream's local time zone (so "2025-01-15" means January 15 in the station's local time)
- Values are rounded integers

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

### StationStreamsCreator / StationEnricher / StationFilter

Used during station import (see [Section 9](#9-station-import)):
- **StationFilter** — deduplicates incoming station data and skips stations whose streams already exist
- **StationEnricher** — adds derived fields: PostGIS location, IANA time zone (via `TimeZoneFinderWrapper`), `source_id`, `stream_configuration_id`, `url_token`
- **StationStreamsCreator** — builds and upserts `station_streams` records

---

## 9. Station Import

Before measurements can be loaded, the corresponding `station_streams` records must exist. Each source has a stations import step that runs separately from the measurement ingestion pipeline.

The mechanics of importing differ per source:

| Source | Method |
|--------|--------|
| EEA | CSV files bundled with the application (`app/services/eea/stations/data/`) |
| EPA | API call to AirNow S3 (`monitoring_site_locations.dat`) |

Despite the different data sources, both follow the same processing pipeline using the shared `GovernmentSources` station components:

```
Parse source data (CSV / API response)
  └─ Build GovernmentSources::Station objects
       └─ StationFilter (deduplicate, skip existing)
            └─ StationEnricher (add location, timezone, source config)
                 └─ StationStreamsCreator (upsert station_streams)
```

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
- `data_parser.rb` — parses the source-specific station list format and returns an array of `GovernmentSources::Station` objects
- `interactor.rb` — orchestrates the station import pipeline using shared components:

```ruby
module NewSource
  module Stations
    class Interactor
      def call(stations_data)
        stations = DataParser.new(stations_data).call
        source = Source.find_by!(name: 'NewSource')

        filtered  = GovernmentSources::StationFilter.new(stations, source).call
        enriched  = GovernmentSources::StationEnricher.new(filtered, source).call
        GovernmentSources::StationStreamsCreator.new(enriched).call
      end
    end
  end
end
```

Create a worker (`ImportStationsWorker`) and trigger it as needed (e.g., daily or on first setup).

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

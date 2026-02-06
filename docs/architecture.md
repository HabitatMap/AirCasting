# AirCasting Architecture Decisions

This document captures architecture decisions across three layers: Database, Data Processing, and API.

---

## 1. Database Layer

### 1.1 Domain Remodeling Overview

The main architectural change is redefining domain models to better represent **fixed stations** - sensors that are fixed in position and report measurements on a regular basis.

**Current Status:** Changes are implemented for the "fixed" part of the domain. Mobile sessions remain on the legacy model.

### 1.2 New Domain Model: Fixed Streams

The new domain model represents **fixed stations** - air quality monitoring stations that have a fixed geographic position and report measurements on a regular basis (typically hourly).

This model is designed to work uniformly for both:
- **Third-party integrations** (EEA, EPA) - stations owned by external organizations
- **AirBeam devices** - user-owned fixed devices

#### Core Tables

```
┌──────────┐
│  users   │──────────────────────────────────────────────────────┐
└──────────┘                                                      │
                                                                  │
┌──────────┐                                                      │
│ devices  │ (AirBeams only, shared across users)                 │
└──────────┘                                                      │
      │                                                           │
      │ 1:N                                                       │ created_by
      │                                                           │ (AirBeams only)
      │                                                           │
┌─────────────┐                                     ┌─────────────────────────┐
│   sources   │─────────────────┬──────────────────>│  stream_configurations  │
└─────────────┘                 │                   └─────────────────────────┘
       │            ┌───────────┴────────────┐                   │
       │            │source_stream_configurations│               │
       │            └────────────────────────┘                   │
       │                                                         │
       ▼                                                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                        fixed_streams                              │
│  + device_id (nullable, AirBeams only)                           │
│  + user_id (nullable, AirBeams only - who created this session)  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │fixed_measurements│             │ hourly_averages │
    └─────────────────┘             └─────────────────┘
```

#### Design Rationale: Flattened Model

The legacy model used `Session → Streams` hierarchy, where Session held location and time context. This caused problems:

- EEA/EPA stations may report different pollutants with different time ranges (PM2.5 from 2020-2024, NO2 from 2022-2024)
- Session as parent couldn't represent these independent lifecycles
- Forced artificial grouping where none existed

The flattened model (`fixed_streams` with individual `first_measured_at`/`last_measured_at`) solves this by treating each measurement channel as independent.

**For AirBeams**, grouping is preserved through:
- `external_ref` (session UUID) - groups streams from the same recording session
- `device_id` - groups streams from the same physical device across sessions

---

### 1.3 Sources

**Domain Concept:** A Source represents an organization or system that provides air quality measurement data. Each source has its own infrastructure, data format, and potentially different measurement configurations.

**Table: `sources`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | |
| name | string | NOT NULL, UNIQUE | Source identifier |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

**Current Sources:**
| Name | Description |
|------|-------------|
| EEA | European Environment Agency - data from 47 European countries |
| EPA | US Environmental Protection Agency (via AirNow API) |

**Future Sources:**
| Name | Description | Status |
|------|-------------|--------|
| AirBeams | User-owned fixed AirBeam devices | [ ] To be added |

**Indexes:**
- `index_sources_on_name` (unique) - ensures source names are unique

---

### 1.4 Devices (AirBeams Only)

**Domain Concept:** A Device represents a physical AirBeam device. Devices are identified by their MAC address and can be shared across users - the user association is at the fixed_stream level (who created a particular recording session), not at the device level.

One device has multiple sensors (PM2.5, PM10, PM1, humidity, temperature), each producing a separate fixed_stream per recording session.

**Table: `devices`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | Internal identifier |
| uuid | uuid | NOT NULL, UNIQUE | Public API identifier for device-level operations |
| mac_address | string | NOT NULL, UNIQUE | Physical device identifier |
| model | string | NOT NULL | Device model: "AirBeam2", "AirBeam3" |
| name | string | nullable | User-given name (e.g., "Backyard sensor") |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

**Indexes:**
- `index_devices_on_uuid` (unique)
- `index_devices_on_mac_address` (unique)

**Notes:**
- Devices do not have a `user_id` because devices can be shared across users
- User association is tracked at the `fixed_streams` level (who created that particular session)
- The `uuid` column is for device-level API operations (e.g., listing all sessions from a device)

---

### 1.5 Stream Configurations

**Domain Concept:** A Stream Configuration defines how a particular type of measurement should be interpreted and displayed. It specifies the measurement type (e.g., PM2.5), the unit of measurement, and the threshold values used for color-coding air quality levels in the UI.

Different sources may use different units for the same pollutant (e.g., NO2 can be measured in ppb or µg/m³), requiring separate configurations.

**Table: `stream_configurations`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | |
| measurement_type | string | NOT NULL | Pollutant type: "PM2.5", "NO2", "Ozone" |
| unit_symbol | string | NOT NULL | Unit of measurement: "µg/m³", "ppb" |
| threshold_very_low | integer | NOT NULL | Upper bound for "very low" (green) |
| threshold_low | integer | NOT NULL | Upper bound for "low" (yellow) |
| threshold_medium | integer | NOT NULL | Upper bound for "medium" (orange) |
| threshold_high | integer | NOT NULL | Upper bound for "high" (red) |
| threshold_very_high | integer | NOT NULL | Upper bound for "very high" (purple) |
| canonical | boolean | NOT NULL | If true, this is the primary config for this measurement type |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

**Indexes:**
- `index_stream_configurations_on_measurement_type_and_unit_symbol` (unique)

**Canonical Configurations** (used by EPA, shared across sources using same units):

| Measurement Type | Unit | Very Low | Low | Medium | High | Very High |
|-----------------|------|----------|-----|--------|------|-----------|
| PM2.5 | µg/m³ | 0 | 9 | 35 | 55 | 150 |
| NO2 | ppb | 0 | 53 | 100 | 360 | 649 |
| Ozone | ppb | 0 | 59 | 75 | 95 | 115 |

**EEA-Specific Configurations** (non-canonical, different units):

| Measurement Type | Unit | Very Low | Low | Medium | High | Very High |
|-----------------|------|----------|-----|--------|------|-----------|
| NO2 | µg/m³ | 0 | 100 | 188 | 677 | 1220 |
| Ozone | µg/m³ | 0 | 116 | 147 | 186 | 225 |

---

### 1.6 Source-Stream Configurations

**Domain Concept:** A join table that defines which stream configurations are valid for each source. This allows controlling which measurement types each source can provide and ensures data consistency.

**Table: `source_stream_configurations`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | |
| source_id | bigint | NOT NULL, FK | Reference to source |
| stream_configuration_id | bigint | NOT NULL, FK | Reference to stream configuration |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

**Indexes:**
- `idx_source_stream_cfg_uniq` (source_id, stream_configuration_id) - unique

**Foreign Keys:**
- `source_stream_configurations.source_id -> sources.id`
- `source_stream_configurations.stream_configuration_id -> stream_configurations.id`

---

### 1.7 Fixed Streams

**Domain Concept:** A Fixed Stream represents a single measurement channel from a fixed monitoring station. It is the core entity of the new model - each stream belongs to one source, measures one type of pollutant (defined by stream configuration), and has a fixed geographic location.

The `external_ref` field stores the identifier used by the source system:
- **EEA/EPA:** Sampling point ID or station identifier
- **AirBeams:** Session UUID generated by the mobile app

**Table: `fixed_streams`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | Internal identifier, used in public API |
| source_id | bigint | NOT NULL, FK | Which source provides this stream |
| stream_configuration_id | bigint | NOT NULL, FK | What type of measurement this stream reports |
| device_id | bigint | FK, nullable | **AirBeams only:** Reference to physical device |
| user_id | bigint | FK, nullable | **AirBeams only:** User who created this session |
| external_ref | string | NOT NULL | Source's identifier (session UUID for AirBeams, sampling point for EEA) |
| location | geometry(4326) | NOT NULL | Geographic position (PostGIS point) |
| time_zone | string | NOT NULL | IANA time zone (e.g., "Europe/Warsaw") |
| first_measured_at | timestamptz | nullable | Timestamp of earliest measurement |
| last_measured_at | timestamptz | nullable | Timestamp of most recent measurement |
| title | string | NOT NULL | Human-readable name for display |
| url_token | string | NOT NULL | Short token for shareable URL generation |
| stream_id | bigint | FK, nullable | **LEGACY:** Link to legacy streams table |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

**Indexes:**
- `idx_fixed_streams_src_ref_cfg_uniq` (source_id, stream_configuration_id, external_ref) - **unique, critical** - prevents duplicate streams
- `index_fixed_streams_on_location` (GiST) - spatial queries
- `index_fixed_streams_on_source_id`
- `index_fixed_streams_on_stream_configuration_id`
- `index_fixed_streams_on_device_id` - for AirBeam device queries
- `index_fixed_streams_on_user_id` - for user's streams queries

**Identifiers Explained:**

| Identifier | Purpose | Example |
|------------|---------|---------|
| `id` | Database PK, used in public API endpoints | `GET /api/fixed_streams/12345` |
| `url_token` | Short shareable URLs | `https://aircasting.org/s/a1b2c` |
| `external_ref` | Source's identifier, used with `stream_configuration_id` for uniqueness | Session UUID (AirBeams), "SPO.DE.DEBB021" (EEA) |

**Source-Specific Column Usage:**

| Column | EEA/EPA | AirBeams |
|--------|---------|----------|
| device_id | NULL | Required (FK to devices) |
| user_id | NULL | Required (who created this session) |
| external_ref | Sampling point ID | Session UUID from mobile app |

**Constraints:**
- `chk_stream_measured_bounds`: `first_measured_at <= last_measured_at`

**Foreign Keys:**
- `fixed_streams.source_id -> sources.id`
- `fixed_streams.stream_configuration_id -> stream_configurations.id`
- `fixed_streams.device_id -> devices.id` (nullable)
- `fixed_streams.user_id -> users.id` (nullable)

---

### 1.8 Fixed Measurements

**Domain Concept:** A Fixed Measurement represents a single data point recorded by a fixed stream at a specific moment in time. This is the time-series data that makes up the core of air quality monitoring.

**Current State:** The table is in a transitional state, containing both legacy fields (for backward compatibility) and new model fields.

**Table: `fixed_measurements`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | |
| fixed_stream_id | bigint | FK, nullable | **NEW:** Reference to fixed stream |
| measured_at | timestamptz | nullable | **NEW:** When the measurement was taken |
| value | float | NOT NULL | The measured value |
| stream_id | bigint | NOT NULL, FK | **LEGACY:** Reference to legacy stream |
| time | datetime | NOT NULL | **LEGACY:** Measurement time (no timezone) |
| time_with_time_zone | timestamptz | NOT NULL | **LEGACY:** Measurement time with timezone |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

**Target Structure** (after migration complete):

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | |
| fixed_stream_id | bigint | NOT NULL, FK | Reference to fixed stream |
| measured_at | timestamptz | NOT NULL | When the measurement was taken |
| value | float | NOT NULL | The measured value |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

**Indexes:**
- `idx_uniq_fixed_stream_measured_at_partial` (fixed_stream_id, measured_at) - **unique, partial** WHERE both NOT NULL - prevents duplicate measurements per stream
- `index_fixed_measurements_on_stream_id_and_time_with_time_zone` (unique) - legacy
- `index_fixed_measurements_on_stream_id` - legacy

**Foreign Keys:**
- `fixed_measurements.fixed_stream_id -> fixed_streams.id`
- `fixed_measurements.stream_id -> streams.id` (legacy)

---

### 1.9 Hourly Averages

**Domain Concept:** Hourly Averages are pre-computed aggregations of measurements, calculated once per hour. They optimize query performance for displaying historical data and charts without aggregating raw measurements on every request.

Currently computed only for EEA data.

**Table: `hourly_averages`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | |
| fixed_stream_id | bigint | NOT NULL, FK | Which stream this average belongs to |
| measured_at | datetime | NOT NULL | The hour this average represents |
| value | integer | NOT NULL | Rounded average value for the hour |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

**Indexes:**
- `index_hourly_averages_on_fixed_stream_and_measured_at` (fixed_stream_id, measured_at, value) - unique
- `index_hourly_averages_on_measured_at` - for time-range queries

**Foreign Keys:**
- `hourly_averages.fixed_stream_id -> fixed_streams.id`

---

### 1.10 Legacy Model (To Be Deprecated)

The legacy model centers around `sessions` and `streams`.

```
┌──────────┐     ┌──────────┐     ┌──────────────────┐
│  users   │────<│ sessions │────<│     streams      │
└──────────┘     └──────────┘     └──────────────────┘
                                          │
                                          ▼
                                  ┌──────────────────┐
                                  │   measurements   │
                                  │ fixed_measurements│
                                  └──────────────────┘
```

#### Legacy Relationship Maintained

**Current State:**
- `fixed_streams.stream_id` links to legacy `streams` table (nullable, marked as `# TEMP`)
- `fixed_measurements` has both `stream_id` (legacy) and `fixed_stream_id` (new)
- Legacy `sessions` + `streams` still created for EEA data (via `Eea::SamplingPoints::Interactor`)
- EPA data migrated to new model via `DataFixes::EpaDataMigrator`

**Why maintained:**
- API endpoints still query via legacy model
- Mobile app sync uses legacy model
- Gradual migration in progress

---

### 1.11 Decision Log

| Decision | Status | Notes |
|----------|--------|-------|
| Use PostGIS geometry for location | Done | SRID 4326, GiST index |
| Composite unique key (source_id, stream_configuration_id, external_ref) | Done | Ensures no duplicate streams |
| Partial unique index on fixed_measurements | Done | Covers new model fields while legacy fields remain |
| Maintain legacy `stream_id` reference | Done (temporary) | For backward compatibility with existing API |
| Pre-computed hourly averages | Done | For EEA data only currently |
| Use database `id` for public API (no separate UUID) | Decided | Simpler; data is public anyway; `url_token` handles short URLs |
| Create `devices` table for AirBeams | Decided | Physical device info (MAC, model); devices can be shared across users |
| Add `device_id` to fixed_streams (nullable) | Decided | Links AirBeam streams to physical device |
| Add `user_id` to fixed_streams (nullable) | Decided | Tracks who created the AirBeam session; NULL for EEA/EPA |
| Use session UUID as `external_ref` for AirBeams | Decided | Mobile app generates UUID per session; same uniqueness pattern as EEA |
| Flattened model works for AirBeams | Decided | `external_ref` groups streams by session; `device_id` groups by device |

---

### 1.12 Future Work

#### [ ] AirBeam Integration

AirBeams (user-owned fixed devices) will be integrated into the new model with the following approach:

**Schema Changes:**
1. Create `devices` table (see section 1.4)
2. Add `device_id` and `user_id` columns to `fixed_streams` (see section 1.7)
3. Create `Source` record for "AirBeams"
4. Map existing AirBeam threshold sets to `stream_configurations`:
   - AirBeam-PM10, AirBeam-PM2.5, AirBeam-PM1 (µg/m³)
   - AirBeam-RH (%)
   - AirBeam-F (F)

**Identifier Strategy:**
- `external_ref` = session UUID generated by mobile app
- `device_id` = FK to devices table (identified by MAC address)
- `user_id` = user who created this recording session
- Database `id` used in public API endpoints
- `url_token` used for short shareable URLs

**Communication Flow (AirBeam → Backend):**
```
1. Mobile app registers session:
   POST /api/sessions {
     uuid: "mobile-session-uuid",
     device_mac: "AA:BB:CC:DD:EE:FF",
     streams: ["PM2.5", "PM10", ...]
   }

   Backend creates:
   - Device record (if new MAC address)
   - fixed_stream for each sensor type, with:
     - external_ref = mobile's session UUID
     - device_id = FK to device
     - user_id = current user

2. AirBeam device sends measurements:
   POST /api/measurements {
     session_uuid: "mobile-session-uuid",
     sensor: "PM2.5",
     values: [...]
   }

   Backend lookup:
   FixedStream.find_by(
     external_ref: session_uuid,
     stream_configuration: PM2.5_config
   )
```

**Grouping & Queries:**
- All streams from same session: `WHERE external_ref = :session_uuid`
- All streams from same device: `WHERE device_id = :device_id`
- All streams by user: `WHERE user_id = :user_id`
- View all pollutants at a station: query by `external_ref` (AirBeams) or location proximity (EEA)

**Migration Path:**
1. Create `devices` table
2. Add `device_id`, `user_id` columns to `fixed_streams`
3. Create AirBeams source and stream_configurations
4. Migrate existing fixed AirBeam sessions to new model
5. Update API endpoints to use new model

#### [ ] Fixed Measurements Cleanup

Once migration complete:

1. Remove legacy columns from `fixed_measurements`:
   - `stream_id`
   - `time`
   - `time_with_time_zone`
2. Make `fixed_stream_id` and `measured_at` NOT NULL
3. Remove legacy indexes

#### [ ] Fixed Streams Cleanup

1. Remove `fixed_streams.stream_id` column (legacy link)
2. Evaluate whether legacy `sessions`/`streams` tables needed for fixed data
3. Consider cleanup or archiving of orphaned legacy records

#### [ ] Index Optimization

Review and optimize indexes based on query patterns:
- Temporal range queries on measurements
- Spatial queries on stream locations
- Source-filtered queries

---

## 2. Data Processing Layer

*To be documented*

---

## 3. API Layer

*To be documented*

# AirCasting Architecture: Domain Model

This document describes the target domain model for AirCasting's fixed streams functionality.

---

## 1. Domain Model Overview

### 1.1 New Domain Model: Fixed Streams

The new domain model represents **fixed streams** - continuous streams of air quality measurements coming from monitoring stations that have a fixed geographic position and report data on a regular basis (hourly or every minute).

This model is designed to work uniformly for both:
- **Third-party integrations** (EEA, EPA) - stations owned by external organizations
- **AirBeam devices** - user-owned fixed devices

#### Core Tables

```
┌─────────────────────┐
│       users         │───────────────────────────────────────────────┐
│  id                 │                                               │
│  email              │                                               │
└─────────────────────┘                                               │
                                                                      │
┌─────────────────────┐                                               │
│      devices        │ (AirBeams only)                               │
│  id                 │                                               │
│  mac_address        │                                               │
│  model              │                                               │
└─────────────────────┘                                               │
         │                                                            │
         │ 1:N                                                        │ user_id
         │                                                            │ (AirBeams only)
         │                                                            │
┌─────────────────────┐                           ┌───────────────────────────────┐
│      sources        │───────────┬──────────────>│     stream_configurations     │
│  id                 │           │               │  id                           │
│  name               │           │               │  measurement_type             │
└─────────────────────┘           │               │  unit_symbol                  │
         │          ┌─────────────┴─────────────┐ │  threshold_very_low/low/...   │
         │          │source_stream_configurations│ │  canonical                    │
         │          │  source_id                │ └───────────────────────────────┘
         │          │  stream_configuration_id  │                │
         │          └───────────────────────────┘                │
         │                                                       │
         ▼                                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              fixed_streams                                    │
│  id, source_id, stream_configuration_id                                      │
│  device_id (nullable, AirBeams only)                                         │
│  user_id (nullable, AirBeams only)                                           │
│  external_ref, location, time_zone, title, url_token                         │
│  first_measured_at, last_measured_at                                         │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│  fixed_measurements   │  │    hourly_averages    │  │    daily_averages     │
│  id                   │  │  id                   │  │  id                   │
│  fixed_stream_id      │  │  fixed_stream_id      │  │  fixed_stream_id      │
│  measured_at          │  │  measured_at          │  │  date                 │
│  value                │  │  value                │  │  value                │
└───────────────────────┘  └───────────────────────┘  └───────────────────────┘
```

#### Design Rationale: Flattened Model

The legacy model used `Session → Streams` hierarchy, where Session held location and time context. This caused problems:

- EEA/EPA stations may report different pollutants with different time ranges
- Session as parent couldn't represent these independent lifecycles
- Forced artificial grouping where none existed

The flattened model (`fixed_streams` with individual `first_measured_at`/`last_measured_at`) solves this by treating each measurement channel as independent.

**For AirBeams**, grouping is preserved through:
- `external_ref` (session UUID) - groups streams from the same recording session
- `device_id` - groups streams from the same physical device across sessions

---

### 1.2 Sources

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

### 1.3 Devices (AirBeams Only)

**Domain Concept:** A Device represents a physical AirBeam device. Devices are identified by their MAC address and can be shared across users - the user association is at the fixed_stream level (who created a particular recording session), not at the device level.

One device has multiple sensors (PM2.5, PM10, PM1, humidity, temperature), each producing a separate fixed_stream per recording session.

**Table: `devices`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | Internal identifier |
| mac_address | string | NOT NULL, UNIQUE | Physical device identifier |
| model | string | NOT NULL | Device model: "AirBeam2", "AirBeam3" |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

**Indexes:**
- `index_devices_on_uuid` (unique)
- `index_devices_on_mac_address` (unique)

**Notes:**
- Devices do not have a `user_id` because devices can be shared across users
- User association is tracked at the `fixed_streams` level (who created that particular session)

---

### 1.4 Stream Configurations

**Domain Concept:** A Stream Configuration defines how a particular type of measurement should be interpreted and displayed. It specifies the measurement type (e.g., PM2.5), the unit of measurement, and the threshold values used for color-coding air quality levels in the UI.

Different sources may use different units for the same pollutant (e.g., NO2 can be measured in ppb or µg/m³), requiring separate configurations.

**Table: `stream_configurations`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | |
| measurement_type | string | NOT NULL | Pollutant type: "PM2.5", "NO2", "Ozone" |
| unit_symbol | string | NOT NULL | Unit of measurement: "µg/m³", "ppb" |
| threshold_very_low | integer | NOT NULL | |
| threshold_low | integer | NOT NULL | |
| threshold_medium | integer | NOT NULL | |
| threshold_high | integer | NOT NULL | |
| threshold_very_high | integer | NOT NULL | |
| canonical | boolean | NOT NULL | If true, this is the canonical config for this measurement type |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

**Indexes:**
- `index_stream_configurations_on_measurement_type_and_unit_symbol` (unique)

#### Canonical vs Source-Specific Configurations

**Canonical configurations** are the system-wide standard configurations, based on EPA thresholds. They serve as the primary reference for each measurement type:

| Measurement Type | Unit | Very Low | Low | Medium | High | Very High |
|-----------------|------|----------|-----|--------|------|-----------|
| PM2.5 | µg/m³ | 0 | 9 | 35 | 55 | 150 |
| NO2 | ppb | 0 | 53 | 100 | 360 | 649 |
| Ozone | ppb | 0 | 59 | 75 | 95 | 115 |

**Source-specific configurations** (non-canonical) allow sources to use different units or thresholds:

| Measurement Type | Unit | Very Low | Low | Medium | High | Very High |
|-----------------|------|----------|-----|--------|------|-----------|
| NO2 | µg/m³ | 0 | 100 | 188 | 677 | 1220 |
| Ozone | µg/m³ | 0 | 116 | 147 | 186 | 225 |

#### How Configurations Are Used

1. **Data Storage:** All measurements are converted to and stored in the canonical configuration's unit. The conversion happens once during import.

2. **Map Display:** The map always displays data using canonical configurations, ensuring consistent color-coding across all sources.

3. **Single Stream Display (planned):** When viewing an individual fixed stream's details, data will be displayed using the source-specific configuration (original units and thresholds). This is not yet implemented.

---

### 1.5 Source-Stream Configurations

**Domain Concept:** A join table that links sources to their specific stream configurations. This defines which measurement types each source provides and what configuration (units, thresholds) each source uses for that measurement type.

This table exists because each source may have its own configuration for a given measurement type. For example, EEA reports NO2 in µg/m³ while EPA reports it in ppb.

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

### 1.6 Fixed Streams

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

### 1.7 Fixed Measurements

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

### 1.8 Aggregations

Pre-computed aggregations optimize query performance by avoiding real-time aggregation of raw measurements.

#### How Aggregations Are Used

1. **Map markers:** The most recent hourly average value is used to display the marker on the map (determines the marker color based on thresholds).

2. **Time lapse:** The time lapse feature uses hourly aggregations to animate air quality changes over time.

3. **Calendar/charts:** Daily averages are used for calendar views and historical charts.

#### 1.8.1 Hourly Averages (New Model)

**Domain Concept:** Pre-computed hourly aggregations of measurements. Calculated twice per hour to ensure timely updates.

**Current Status:** Used for EEA data only. EPA and AirBeam data still use the legacy `stream_hourly_averages` table.

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

#### 1.8.2 Stream Hourly Averages (Legacy)

**Table: `stream_hourly_averages`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | |
| stream_id | bigint | NOT NULL, FK | Reference to legacy stream |
| value | integer | NOT NULL | Rounded average value for the hour |
| date_time | datetime | NOT NULL | The hour this average represents |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

**Indexes:**
- `index_stream_hourly_averages_on_stream_id_and_date_time` (unique)

Calculated once per hour (at minute 1). Used for EPA and AirBeam data until migration to new model.

#### 1.8.3 Stream Daily Averages

**Domain Concept:** Pre-computed daily aggregations of measurements. Used for calendar views and historical data display.

**Current Status:** Only exists as legacy table linked to `stream_id`. Will need migration to new model when removing legacy stream relation.

**Table: `stream_daily_averages`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | |
| stream_id | bigint | NOT NULL, FK | Reference to legacy stream |
| value | integer | NOT NULL | Rounded average value for the day |
| date | date | NOT NULL | The day this average represents |
| created_at | datetime | NOT NULL | |
| updated_at | datetime | NOT NULL | |

**Indexes:**
- `index_stream_daily_averages_on_stream_id_and_date` (unique)

Calculated hourly (at minute 5).

---

### 1.9 Legacy Model (To Be Deprecated)

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

### 1.10 Future Work

#### [ ] AirBeam Integration

AirBeams (user-owned fixed devices) will be integrated into the new model with the following approach:

**Schema Changes:**
1. Create `devices` table (see section 1.3)
2. Add `device_id` and `user_id` columns to `fixed_streams` (see section 1.6)
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
2. Cleanup legacy records (sessions and streams)

#### [ ] Aggregations Migration

1. Create `daily_averages` table (linked to `fixed_stream_id`)
2. Migrate data from `stream_daily_averages` to new table
3. Update API endpoints to use new aggregation tables
4. Remove legacy `stream_daily_averages` and `stream_hourly_averages` tables

#### [ ] Index Optimization

Review and optimize indexes based on query patterns:
- Temporal range queries on measurements
- Spatial queries on stream locations
- Source-filtered queries

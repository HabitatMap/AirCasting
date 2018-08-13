# API documentation

Every response is returned in JSON format.

## GET /api/sessions

**Remember:** this call will not return measurements data for requested sessions. To do that, use the single session
endpoint below, i.e. `/api/sessions/:id`

### Parameters

| name           | type              | default value |
|:---------------|:------------------|:--------------|
| page           | number            | 0             |
| page_size      | number            | 50            |
| q[time_from]   | number, 0..1439   |               |
| q[time_to]     | number, 0..1439   |               |
| q[day_from]    | number, 1..366    |               |
| q[day_to]      | number, 1..366    |               |
| q[year_from]   | number, >= 2011   |               |
| q[year_to]     | number, >= 2011   |               |
| q[tags]        | text              |               |
| q[usernames]   | text              |               |
| q[location]    | text              |               |
| q[sensor_name] | text              |               |
| q[unit_symbol] | text              |               |
| q[east]        | number, -180..180 |               |
| q[west]        | number, -180..180 |               |
| q[north]       | number, -90..90   |               |
| q[south]       | number, -90..90   |               |

### Example URL

```
curl http://aircasting.org/api/sessions.json?page=0&page_size=50&q[measurements]=true&q[time_from]=0&q[time_to]=1439&q[day_from]=0&q[day_to]=355&q[usernames]=HHHDenver&q[location]=Denver&q[sensor_name]=AirBeam-PM&q[unit_symbol]=µg/m³
```

### Example response

```json
[
  {
    "end_time_local": "2015-09-09T17:49:38Z",
    "id": 9586,
    "start_time_local": "2015-09-09T17:19:16Z",
    "title": "Bike ride short ",
    "username": "HHHDenver",
    "streams": {
      "AirBeam-PM": {
        "average_value": 3.47621,
        "id": 26343,
        "max_latitude": "39.68933377",
        "max_longitude": "-104.89177015",
        "measurement_short_type": "PM",
        "measurement_type": "Particulate Matter",
        "measurements_count": 1814,
        "min_latitude": "39.68364632",
        "min_longitude": "-104.89647254",
        "sensor_name": "AirBeam-PM",
        "sensor_package_name": "AirBeam:001896105CBB",
        "session_id": 9586,
        "threshold_high": 55,
        "threshold_low": 12,
        "threshold_medium": 35,
        "threshold_very_high": 150,
        "threshold_very_low": 0,
        "unit_name": "micrograms per cubic meter",
        "unit_symbol": "µg/m³",
        "size": 1814
      }
    }
  }
]
```

## GET /api/sessions/:id

### Example URL

```
curl http://aircasting.org/api/sessions/9586.json
```

### Example response

```json
{
  "calibration": 100,
  "contribute": true,
  "created_at": "2015-09-09T23:50:47Z",
  "data_type": null,
  "description": "",
  "end_time": "2015-09-09T17:49:38Z",
  "end_time_local": "2015-09-09T17:49:38Z",
  "id": 9586,
  "instrument": null,
  "measurements_count": null,
  "offset_60_db": 0,
  "os_version": "android-5.0.1",
  "phone_model": "SCH-I545",
  "start_time": "2015-09-09T17:19:16Z",
  "start_time_local": "2015-09-09T17:19:16Z",
  "timezone_offset": null,
  "title": "Bike ride short ",
  "updated_at": "2015-09-09T23:50:47Z",
  "url_token": "412mb",
  "user_id": 676,
  "uuid": "34cf435f-e320-4aaf-844d-6be3da866e0d",
  "notes": [
    {
      "created_at": "2015-09-09T17:19:16Z",
      "date": "2015-09-09T17:19:16Z",
      "id": 19,
      "latitude": "39.68933377",
      "longitude": "-104.89647254",
      "number": 0,
      "photo_content_type": "application/octet-stream",
      "photo_file_name": "1326449167743.jpg",
      "photo_file_size": 303540,
      "photo_updated_at": "2015-09-09T17:19:16Z",
      "session_id": 9586,
      "text": "Registering 84 dB peak and 64 dB average",
      "updated_at": "2015-09-09T17:19:16Z"
    }
  ],
  "streams": {
    "AirBeam-PM": {
      "average_value": 3.47621,
      "id": 26343,
      "max_latitude": "39.68933377",
      "max_longitude": "-104.89177015",
      "measurement_short_type": "PM",
      "measurement_type": "Particulate Matter",
      "measurements_count": 1814,
      "min_latitude": "39.68364632",
      "min_longitude": "-104.89647254",
      "sensor_name": "AirBeam-PM",
      "sensor_package_name": "AirBeam:001896105CBB",
      "session_id": 9586,
      "threshold_high": 55,
      "threshold_low": 12,
      "threshold_medium": 35,
      "threshold_very_high": 150,
      "threshold_very_low": 0,
      "unit_name": "micrograms per cubic meter",
      "unit_symbol": "µg/m³",
      "measurements": [
        {
          "id": 56292378,
          "latitude": "39.68352651",
          "longitude": "-104.89157664",
          "measured_value": 2.69,
          "milliseconds": 31,
          "stream_id": 26343,
          "time": "2015-09-09T17:19:18Z",
          "timezone_offset": 0,
          "value": 2.69
        }
      ],
      "size": 1814
    }
  }
}
```
## GET /api/averages

To get multiple average values for polygons in a region, you would use this query:

### Parameters

| name            | type              | default value |
|:----------------|:------------------|:--------------|
| time_from       | number, 0..1439   |               |
| time_to         | number, 0..1439   |               |
| day_from        | number, 1..366    |               |
| day_to          | number, 1..366    |               |
| year_from       | number, >= 2011   |               |
| year_to         | number, >= 2011   |               |
| grid_size_y     | number, 1..50     |               |
| grid_size_x     | number, 1..50     |               |
| tags            | text              |               |
| usernames       | text              |               |
| sensor_name     | text              |               |
| unit_symbol     | text              |               |
| east            | number, -180..180 |               |
| west            | number, -180..180 |               |
| north           | number, -90..90   |               |
| south           | number, -90..90   |               |
| measurement_type| text              |               |

### Example URL

```
curl http://aircasting.org/api/averages.json?q[west]=-105.42674388525387&q[east]=-104.28347911474606&q[south]=39.530285217883865&q[north]=39.99792504639966&q[time_from]=1320&q[time_to]=1319&q[day_from]=0&q[day_to]=365&q[year_from]=2015&q[year_to]=2016&q[grid_size_x]=46.98081264108352&q[grid_size_y]=25&q[sensor_name]=AirBeam-PM&q[measurement_type]=Particulate+Matter&q[unit_symbol]=µg/m³
```

### Example response

```json
[
  {
    "value": 5.91492021801733,
    "west": -105.26734642360522,
    "east": -105.24249284163766,
    "south": 39.95864065006056,
    "north": 39.97751131860841
  },
  {
    "value": 14.44272413621971,
    "west": -105.26734642360522,
    "east": -105.24249284163766,
    "south": 39.9775113186084,
    "north": 39.99638198715625
  },
  {
    "value": 18.60066334891042,
    "west": -105.26734642360522,
    "east": -105.24249284163766,
    "south": 39.99638198715625,
    "north": 40.015252655704096
  },
  ...
]
```

## GET /api/region

This will let you fetch the average measured value for a region of the map specified by the `east`, `west`, `north` and `south` parameters. Also pass the `measurement_type` and `sensor_name` parameters to specify the measurements you want the average of.

### Parameters

| name            | type              | default value |
|:----------------|:------------------|:--------------|
| time_from       | number, 0..1439   |               |
| time_to         | number, 0..1439   |               |
| day_from        | number, 1..366    |               |
| day_to          | number, 1..366    |               |
| year_from       | number, >= 2011   |               |
| year_to         | number, >= 2011   |               |
| grid_size_y     | number, 1..50     |               |
| grid_size_x     | number, 1..50     |               |
| tags            | text              |               |
| usernames       | text              |               |
| sensor_name     | text              |               |
| unit_symbol     | text              |               |
| east            | number, -180..180 |               |
| west            | number, -180..180 |               |
| north           | number, -90..90   |               |
| south           | number, -90..90   |               |
| measurement_type| text              |               |

### Example URL

```
curl http://aircasting.org/api/region.json?day_from=0&day_to=365&east=165.44168097265174&grid_size_x=1&grid_size_y=1&measurement_type=Particulate+Matter&north=-24.217858119836414&sensor_name=AirBeam-PM&south=-30.55369611748509&tags=&time_from=1320&time_to=1319&unit_symbol=%C2%B5g%2Fm%C2%B3&usernames=&west=144.34793097265174&year_from=2015&year_to=2016
```

### Example response

```json
{
  "average": "3.050341895701678",
  "top_contributors": [
    "ILAQH"
  ],
  "number_of_contributors": 1,
  "number_of_samples": 379359
}
```

## GET /api/v2/data/sessions/last

### URL

```
curl http://aircasting.org/api/v2/data/sessions/last
```

### Example response

```json
{"id":10105}
```

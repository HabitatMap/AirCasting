# API documentation

Every response is returned in JSON format.

## GET /api/sessions

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
| q[distance]    | number            |               |
| q[sensor_name] | text              |               |
| q[unit_symbol] | text              |               |
| q[east]        | number, -180..180 |               |
| q[west]        | number, -180..180 |               |
| q[north]       | number, -90..90   |               |
| q[south]       | number, -90..90   |               |
| q[measurements]| true,false        | false         |

### Example URL

```
curl http://aircasting.org/api/sessions.json?page=0&page_size=50&q[measurements]=true&q[time_from]=0&q[time_to]=1439&q[day_from]=0&q[day_to]=355&q[usernames]=HHHDenver&q[location]=Denver&q[distance]=50&q[sensor_name]=AirBeam-PM&q[unit_symbol]=µg/m³
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
]
```

## GET /api/sessions/:id

### Example URL

```
curl http://aircasting.org/api/sessions/9586
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

## GET /api/v2/data/sessions/last

### URL

```
curl http://aircasting.org/api/v2/data/sessions/last
```

### Example response

```json
{"id":10105}
```

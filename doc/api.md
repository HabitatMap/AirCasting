# API documentation

Every response is returned in JSON format.

## Sessions

Endpoints

- GET `/api/realtime/streaming_sessions.json` -> streaming fixed sessions
- GET `/api/fixed/dormant/sessions.json` -> fixed dormant sessions
- GET `/api/mobile/sessions.json` -> mobile sessions

**Remember:** this call will not return measurements data for requested sessions. To do that, use either the single session or measurements endpoint below.

### Parameters

| name           | type              | default value |
| :------------- | :---------------- | :------------ |
| limit          | number            |               |
| offset         | number            |               |
| q[time_from]   | number            |               |
| q[time_to]     | number            |               |
| q[tags]        | text              |               |
| q[usernames]   | text              |               |
| q[location]    | text              |               |
| q[sensor_name] | text              |               |
| q[unit_symbol] | text              |               |
| q[east]        | number, -180..180 |               |
| q[west]        | number, -180..180 |               |
| q[north]       | number, -90..90   |               |
| q[south]       | number, -90..90   |               |

How to select the time range:
- `time_from` and `time_to` should be passed as seconds since epoch.
- They should be expressed in UTC.
- Date and time of the day are separate filters. This means that selecting `q[time_from]=1559372400` and `q[time_to]=1559559600` which corresponds to June 1, 2019 **7 AM** - June 3, 2019 **11 AM** will return sessions that were recording in the morning during these 3 days.
- To see all session from that period use June 1, 2019 12:00:00 AM - June 3, 2019 11:59:59 PM.
- Every session that has at least one measurement in the selected time range will be included in the results.

### Example request

```
curl http://aircasting.org/api/mobile/sessions.json?limit=50&offset=0&q[measurements]=true&q[time_from]=0&q[time_to]=1552648500&q[usernames]=HHHDenver&q[location]=Denver&q[sensor_name]=AirBeam-PM&q[unit_symbol]=µg/m³
```

### Example response

```json
{
  "sessions": [
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
  ],
  "fetchableSessionsCount": 1
}
```

## Session

GET `/api/sessions/:id`

### Example request

```
curl http://aircasting.org/api/sessions/9586.json
```

### Example response

```json
{
  "contribute": true,
  "created_at": "2015-09-09T23:50:47Z",
  "data_type": null,
  "end_time": "2015-09-09T17:49:38Z",
  "end_time_local": "2015-09-09T17:49:38Z",
  "id": 9586,
  "instrument": null,
  "measurements_count": null,
  "start_time": "2015-09-09T17:19:16Z",
  "start_time_local": "2015-09-09T17:19:16Z",
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
          "value": 2.69
        }
      ],
      "size": 1814
    }
  }
}
```

## Measurements for stream id

GET `/api/measurements.json`

### Example request

```
curl http://aircasting.org/api/measurements.json/?end_time=2281550369000&start_time=0&stream_id=1
```

Where

- `end_time` and `start_time` are optional and are expressed in [POSIX time](https://en.wikipedia.org/wiki/Unix_time)
- `start_time=0` means 1970-01-01 at 00:00:00 UTC
- `end_time=2281550369000` means 2042-04-19 19:59:29 UTC
- it's possible to convert dates to POSIX [here](https://www.unixtimestamp.com/index.php); for example converting 1970-01-01 at 00:00:00 UTC returns 0 (as explained above)

## Averages

GET `/api/averages`

To get multiple average values for polygons in a region. You need to pass a list of session ids otherwise nothing will be returned.

### Parameters

| name             | type              | default value |
| :--------------- | :---------------- | :------------ |
| time_from        | number            |               |
| time_to          | number            |               |
| grid_size_y      | number, 1..50     |               |
| grid_size_x      | number, 1..50     |               |
| tags             | text              |               |
| usernames        | text              |               |
| sensor_name      | text              |               |
| unit_symbol      | text              |               |
| east             | number, -180..180 |               |
| west             | number, -180..180 |               |
| north            | number, -90..90   |               |
| south            | number, -90..90   |               |
| measurement_type | text              |               |
| session_ids      | list number       | empty list    |

How to select the time range:
- `time_from` and `time_to` should be passed as seconds since epoch.
- They should be expressed in UTC.
- Date and time of the day are separate filters. This means that selecting `q[time_from]=1559372400` and `q[time_to]=1559559600` which corresponds to June 1, 2019 **7 AM** - June 3, 2019 **11 AM** will return measurements recorded in the morning during these 3 days.
- To see all measurements from that period use June 1, 2019 12:00:00 AM - June 3, 2019 11:59:59 PM.

### Example request

```
curl 'http://aircasting.org/api/averages.json?q=%7B%22west%22:-123.50830115625001,%22east%22:-67.91748084375001,%22south%22:30.334954095062294,%22north%22:43.29320049354096,%22time_from%22:0,%22time_to%22:1552648992,%22grid_size_x%22:85.47297297297297,%22grid_size_y%22:25,%22tags%22:%22%22,%22usernames%22:%22%22,%22sensor_name%22:%22AirBeam2-PM2.5%22,%22measurement_type%22:%22Particulate+Matter%22,%22unit_symbol%22:%22%C2%B5g%2Fm%C2%B3%22,%22session_ids%22:%5B57488,57487,57469,57468,57333,57331,57326,57321,57319,57299,57073,56976,56975,56974,56965,56898,56797,56792,56714,56711,56297,56271,56183,55885,55851,55850,55849,55819,55487,55485,55482,55481,55398,55377,55376,55375,55374,55364,55363,55332,55268,55266,55239,55196,55016,55007,54914,54910,54909,54907%5D%7D'
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

## Region

GET `/api/region`

This will let you fetch the average measured value for a region of the map specified by the `east`, `west`, `north` and `south` parameters. Also pass the `measurement_type` and `sensor_name` parameters to specify the measurements you want the average of. You need to pass a list of session ids otherwise nothing will be returned.

### Parameters

| name             | type              | default value |
| :--------------- | :---------------- | :------------ |
| time_from        | number            |               |
| time_to          | number            |               |
| grid_size_y      | number, 1..50     |               |
| grid_size_x      | number, 1..50     |               |
| tags             | text              |               |
| usernames        | text              |               |
| sensor_name      | text              |               |
| unit_symbol      | text              |               |
| east             | number, -180..180 |               |
| west             | number, -180..180 |               |
| north            | number, -90..90   |               |
| south            | number, -90..90   |               |
| measurement_type | text              |               |
| session_ids      | list number       | empty list    |

Where time_from and time_to are seconds since epoch.

### Example request

```
curl 'http://aircasting.org/api/region.json?q=%7B%22west%22:-84.6942497702206,%22east%22:-84.04024011948529,%22south%22:37.68000734867853,%22north%22:38.28288746625739,%22time_from%22:0,%22time_to%22:1552648992,%22grid_size_x%22:85.47297297297297,%22grid_size_y%22:25,%22tags%22:%22%22,%22usernames%22:%22%22,%22sensor_name%22:%22AirBeam2-PM2.5%22,%22measurement_type%22:%22Particulate+Matter%22,%22unit_symbol%22:%22%C2%B5g%2Fm%C2%B3%22,%22session_ids%22:%5B57488,57487,57469,57468,57333,57331,57326,57321,57319,57299,57073,56976,56975,56974,56965,56898,56797,56792,56714,56711,56297,56271,56183,55885,55851,55850,55849,55819,55487,55485,55482,55481,55398,55377,55376,55375,55374,55364,55363,55332,55268,55266,55239,55196,55016,55007,54914,54910,54909,54907%5D%7D'
```

### Example response

```json
{
  "average": "3.050341895701678",
  "number_of_contributors": 1,
  "number_of_samples": 379359
}
```

## Last Session

GET `/api/v2/data/sessions/last`

### URL

```
curl http://aircasting.org/api/v2/data/sessions/last.json
```

### Example response

```json
{ "id": 10105 }
```

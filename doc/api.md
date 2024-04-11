<p align="center">
 <b>API documentation</b>
</p>

This is not a stable API, please check in periodically to make sure your queries are up to date.

Every response is returned in JSON format.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [List of Sessions](#list-of-sessions)
  - [Mobile](#mobile)
  - [Fixed Active](#fixed-active)
  - [Fixed Dormant](#fixed-dormant)
- [Mobile Session with Stream and Measurements](#mobile-session-with-stream-and-measurements)
- [Measurements](#measurements)
- [Streams](#streams)
- [Averages](#averages)
- [Region](#region)
- [Last Session](#last-session)
- [Parameters description](#parameters-description)
- [FAQ](#faq)
  - [How to encode URLs](#how-to-encode-urls)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# List of Sessions

Endpoints that return a list of sessions and their streams (without measurements).

## Mobile

**Endpoint**

GET `/api/mobile/sessions.json`

**Parameters**

| name                | type              | required |
| :------------------ | :---------------- | :------- |
| q[time_from]        | number            | yes      |
| q[time_to]          | number            | yes      |
| q[tags]             | text              | yes      |
| q[usernames]        | text              | yes      |
| q[west]             | number, -180..180 | yes      |
| q[east]             | number, -180..180 | yes      |
| q[south]            | number, -90..90   | yes      |
| q[north]            | number, -90..90   | yes      |
| q[limit]            | number            | yes      |
| q[offset]           | number            | yes      |
| q[sensor_name]      | text              | yes      |
| q[measurement_type] | text              | yes      |
| q[unit_symbol]      | text              | yes      |

See [parameters description](#parameters-description)

**Example**

- request
  ```json
  http://aircasting.habitatmap.org/api/mobile/sessions.json?q={"time_from":1533081600,"time_to":1535759940,"tags":"","usernames":"HabitatMap","west":-74.00000000,"east":-73.00000000,"south":40.00000000,"north":41.00000000,"limit":1,"offset":0,"sensor_name":"airbeam2-pm2.5","measurement_type":"Particulate Matter","unit_symbol":"µg/m³"}
  ```
- encoded request
  ```
  curl http://aircasting.habitatmap.org/api/mobile/sessions.json?q=%7B%22time_from%22%3A1533081600%2C%22time_to%22%3A1535759940%2C%22tags%22%3A%22%22%2C%22usernames%22%3A%22HabitatMap%22%2C%22west%22%3A-74.00000000%2C%22east%22%3A-73.00000000%2C%22south%22%3A40.00000000%2C%22north%22%3A41.00000000%2C%22limit%22%3A1%2C%22offset%22%3A0%2C%22sensor_name%22%3A%22airbeam2-pm2.5%22%2C%22measurement_type%22%3A%22Particulate%20Matter%22%2C%22unit_symbol%22%3A%22%C2%B5g%2Fm%C2%B3%22%7D
  ```
  See [how to encode URLs](#how-to-encode-urls)
- response

  ```json
  {
    "sessions": [
      {
        "id": 64047,
        "title": "soho to Park slope",
        "start_time_local": "2018-08-28T14:08:47.000Z",
        "end_time_local": "2018-08-28T14:34:06.000Z",
        "type": "MobileSession",
        "username": "HabitatMap",
        "streams": {
          "AirBeam2-PM2.5": {
            "average_value": 21.2783,
            "id": 219614,
            "max_latitude": 40.72111137,
            "max_longitude": -73.97625898,
            "measurement_short_type": "PM",
            "measurement_type": "Particulate Matter",
            "measurements_count": 1520,
            "min_latitude": 40.68043272,
            "min_longitude": -73.99912318,
            "sensor_name": "AirBeam2-PM2.5",
            "sensor_package_name": "AirBeam2:00189610719F",
            "session_id": 64047,
            "size": 1520,
            "start_latitude": 40.72107652,
            "start_longitude": -73.99801224,
            "threshold_high": 55,
            "threshold_low": 12,
            "threshold_medium": 35,
            "threshold_very_high": 150,
            "threshold_very_low": 0,
            "unit_name": "micrograms per cubic meter",
            "unit_symbol": "µg/m³"
          }
        }
      }
    ],
    "fetchableSessionsCount": 2
  }
  ```

## Fixed Active

Active sessions recorded data in the last 24h.

**Endpoint**

GET `/api/fixed/active/sessions.json`

**Parameters**

| name                | type              | required | default behaviour                                                        |
| :------------------ | :---------------- | :------- | :----------------------------------------------------------------------- |
| q[time_from]        | number            | yes      | N/A                                                                      |
| q[time_to]          | number            | yes      | N/A                                                                      |
| q[sensor_name]      | text              | yes      | N/A                                                                      |
| q[unit_symbol]      | text              | yes      | N/A                                                                      |
| q[tags]             | text              | yes      | N/A                                                                      |
| q[usernames]        | text              | yes      | N/A                                                                      |
| q[measurement_type] | text              | yes      | N/A                                                                      |
| q[is_indoor]        | bool              | no       | returns sessions of any placement                                        |
| q[west]             | number, -180..180 | no       | returns sessions from all location unless all 4 coordinates are provided |
| q[east]             | number, -180..180 | no       | returns sessions from all location unless all 4 coordinates are provided |
| q[south]            | number, -90..90   | no       | returns sessions from all location unless all 4 coordinates are provided |
| q[north]            | number, -90..90   | no       | returns sessions from all location unless all 4 coordinates are provided |

See [parameters description](#parameters-description)

**Example**

- request
  ```json
  http://aircasting.habitatmap.org/api/fixed/active/sessions.json?q={"time_from":"1531008000","time_to":"1562630399","tags":"","usernames":"","west":-73.9766655034307,"east":-73.97618605856928,"south":40.68019783151002,"north":40.680367168382396,"sensor_name":"airbeam2-pm2.5","measurement_type":"Particulate Matter","unit_symbol":"µg/m³"}
  ```
- encoded request

  ```
  curl http://aircasting.habitatmap.org/api/fixed/active/sessions.json?q=%7B%22time_from%22%3A%221531008000%22%2C%22time_to%22%3A%221562630399%22%2C%22tags%22%3A%22%22%2C%22usernames%22%3A%22%22%2C%22west%22%3A-73.9766655034307%2C%22east%22%3A-73.97618605856928%2C%22south%22%3A40.68019783151002%2C%22north%22%3A40.680367168382396%2C%22sensor_name%22%3A%22airbeam2-pm2.5%22%2C%22measurement_type%22%3A%22Particulate%20Matter%22%2C%22unit_symbol%22%3A%22%C2%B5g%2Fm%C2%B3%22%7D
  ```

  See [how to encode URLs](#how-to-encode-urls)

- response

  ```json
  {
    "sessions": [
      {
        "id": 73984,
        "title": "HabitatMap HQ - Cellular",
        "start_time_local": "2018-12-04T11:23:51.000Z",
        "end_time_local": "2019-07-08T07:18:15.000Z",
        "last_hour_average": 5.32786885245902,
        "is_indoor": false,
        "latitude": 40.6802825,
        "longitude": -73.976425781,
        "type": "FixedSession",
        "username": "HabitatMap",
        "streams": {
          "AirBeam2-PM2.5": {
            "average_value": null,
            "id": 257428,
            "max_latitude": 40.6802825,
            "max_longitude": -73.976425781,
            "measurement_short_type": "PM",
            "measurements_count": 300222,
            "min_latitude": 40.6802825,
            "min_longitude": -73.976425781,
            "sensor_name": "AirBeam2-PM2.5",
            "sensor_package_name": "Airbeam2-001896038A92",
            "session_id": 73984,
            "size": 300222,
            "start_latitude": 40.6802825,
            "start_longitude": -73.976425781,
            "threshold_high": 55,
            "threshold_low": 12,
            "threshold_medium": 35,
            "threshold_very_high": 150,
            "threshold_very_low": 0,
            "unit_name": "microgram per cubic meter",
            "unit_symbol": "µg/m³"
          }
        }
      }
    ],
    "fetchableSessionsCount": 1
  }
  ```

**Endpoint**

GET `/api/fixed/active/sessions2.json`

**Parameters**

| name                | type              | required | default behaviour                                                        |
| :------------------ | :---------------- | :------- | :----------------------------------------------------------------------- |
| q[time_from]        | number            | yes      | N/A                                                                      |
| q[time_to]          | number            | yes      | N/A                                                                      |
| q[sensor_name]      | text              | yes      | N/A                                                                      |
| q[unit_symbol]      | text              | yes      | N/A                                                                      |
| q[tags]             | text              | yes      | N/A                                                                      |
| q[usernames]        | text              | yes      | N/A                                                                      |
| q[measurement_type] | text              | yes      | N/A                                                                      |
| q[is_indoor]        | bool              | no       | returns sessions of any placement                                        |
| q[west]             | number, -180..180 | no       | returns sessions from all location unless all 4 coordinates are provided |
| q[east]             | number, -180..180 | no       | returns sessions from all location unless all 4 coordinates are provided |
| q[south]            | number, -90..90   | no       | returns sessions from all location unless all 4 coordinates are provided |
| q[north]            | number, -90..90   | no       | returns sessions from all location unless all 4 coordinates are provided |

See [parameters description](#parameters-description)

**Example**

- request
  ```json
  http://aircasting.habitatmap.org/api/fixed/active/sessions2.json?q={"time_from":"1531008000","time_to":"1562630399","tags":"","usernames":"","west":-73.9766655034307,"east":-73.97618605856928,"south":40.68019783151002,"north":40.680367168382396,"sensor_name":"airbeam2-pm2.5","measurement_type":"Particulate Matter","unit_symbol":"µg/m³"}
  ```
- encoded request

  ```
  curl http://aircasting.habitatmap.org/api/fixed/active/sessions.json?q=%7B%22time_from%22%3A%221531008000%22%2C%22time_to%22%3A%221562630399%22%2C%22tags%22%3A%22%22%2C%22usernames%22%3A%22%22%2C%22west%22%3A-73.9766655034307%2C%22east%22%3A-73.97618605856928%2C%22south%22%3A40.68019783151002%2C%22north%22%3A40.680367168382396%2C%22sensor_name%22%3A%22airbeam2-pm2.5%22%2C%22measurement_type%22%3A%22Particulate%20Matter%22%2C%22unit_symbol%22%3A%22%C2%B5g%2Fm%C2%B3%22%7D
  ```

  See [how to encode URLs](#how-to-encode-urls)

- response

  ```json
  {
    "sessions": [
      {
        "id": 73984,
        "title": "HabitatMap HQ - Cellular",
        "start_time_local": "2018-12-04T11:23:51.000Z",
        "end_time_local": "2019-07-08T07:18:15.000Z",
        "last_measurement_value": 5.32786885245902,
        "is_indoor": false,
        "latitude": 40.6802825,
        "longitude": -73.976425781,
        "username": "HabitatMap",
        "streams": {
          "AirBeam2-PM2.5": {
            "measurement_short_type": "PM",
            "sensor_name": "AirBeam2-PM2.5",
            "unit_symbol": "µg/m³",
            "id": 123
          }
        }
      }
    ],
    "fetchableSessionsCount": 1
  }
  ```

## Fixed Dormant

**Endpoint**

GET `/api/fixed/dormant/sessions.json`

**Parameters**

| name                | type              | required | default behaviour                                                        |
| :------------------ | :---------------- | :------- | :----------------------------------------------------------------------- |
| q[time_from]        | number            | yes      | N/A                                                                      |
| q[time_to]          | number            | yes      | N/A                                                                      |
| q[sensor_name]      | text              | yes      | N/A                                                                      |
| q[measurement_type] | text              | yes      | N/A                                                                      |
| q[unit_symbol]      | text              | yes      | N/A                                                                      |
| q[tags]             | text              | yes      | N/A                                                                      |
| q[usernames]        | text              | yes      | N/A                                                                      |
| q[is_indoor]        | bool              | no       | returns sessions of any placement                                        |
| q[west]             | number, -180..180 | no       | returns sessions from all location unless all 4 coordinates are provided |
| q[east]             | number, -180..180 | no       | returns sessions from all location unless all 4 coordinates are provided |
| q[south]            | number, -90..90   | no       | returns sessions from all location unless all 4 coordinates are provided |
| q[north]            | number, -90..90   | no       | returns sessions from all location unless all 4 coordinates are provided |
| q[limit]            | number            | no       | returns all sessions                                                     |
| q[offset]           | number            | no       | starts at the beginning                                                  |

See [parameters description](#parameters-description)

**Example**

- request

  ```json
  http://aircasting.habitatmap.org/api/fixed/dormant/sessions.json?q={"time_from":1543622400,"time_to":1546300740,"tags":"","usernames":"HabitatMap","sensor_name":"airbeam2-pm2.5","measurement_type":"Particulate Matter","unit_symbol":"µg/m³"}
  ```

* encoded request

  ```
  curl http://aircasting.habitatmap.org/api/fixed/dormant/sessions.json?q=%7B%22time_from%22%3A1543622400%2C%22time_to%22%3A1546300740%2C%22tags%22%3A%22%22%2C%22usernames%22%3A%22HabitatMap%22%2C%22sensor_name%22%3A%22airbeam2-pm2.5%22%2C%22measurement_type%22%3A%22Particulate%20Matter%22%2C%22unit_symbol%22%3A%22%C2%B5g%2Fm%C2%B3%22%7D
  ```

  See [how to encode URLs](#how-to-encode-urls)

* response

  ```json
  {
    "sessions": [
      {
        "id": 49869,
        "title": "HabitatMap HQ - Cellular",
        "start_time_local": "2018-03-23T16:22:07.000Z",
        "end_time_local": "2018-12-04T11:07:03.000Z",
        "is_indoor": false,
        "latitude": 40.6802725,
        "longitude": -73.976386719,
        "type": "FixedSession",
        "username": "HabitatMap",
        "streams": {
          "AirBeam2-PM2.5": {
            "average_value": null,
            "id": 170225,
            "max_latitude": 40.6802725,
            "max_longitude": 40.6802725,
            "measurement_short_type": "PM",
            "measurement_type": "Particulate Matter",
            "measurements_count": 341894,
            "min_latitude": -73.976386719,
            "min_longitude": -73.976386719,
            "sensor_name": "AirBeam2-PM2.5",
            "sensor_package_name": "Airbeam2-001896038A92",
            "session_id": 49869,
            "size": 341894,
            "start_latitude": 40.6802725,
            "start_longitude": -73.976386719,
            "threshold_high": 55,
            "threshold_low": 12,
            "threshold_medium": 35,
            "threshold_very_high": 150,
            "threshold_very_low": 0,
            "unit_name": "microgram per cubic meter",
            "unit_symbol": "µg/m³"
          }
        }
      }
    ],
    "fetchableSessionsCount": 1
  }
  ```

# Mobile Session with Stream and Measurements

Endpoint that returns a mobile session with selected stream and all its
measurements.

**Endpoint**

GET `/api/mobile/sessions2/:id`

**Parameters**

| name           | type | required |
| :------------- | :--- | :------- |
| q[sensor_name] | text | yes      |

**Example**

- request

  ```
  curl http://aircasting.habitatmap.org/api/mobile/sessions2/94192.json?sensor_name=AirBeam2-PM2.5
  ```

- response

  ```json
  {
    "title": "North slope",
    "average": 5.86653771760155,
    "id": 94192,
    "contribute": true,
    "created_at": "2019-06-27T17:56:53.000Z",
    "data_type": null,
    "end_time": "2019-06-27T13:56:48.000Z",
    "end_time_local": "2019-06-27T13:56:48.000Z",
    "instrument": null,
    "is_indoor": false,
    "last_measurement_at": null,
    "latitude": 0.0,
    "longitude": 0.0,
    "measurements_count": null,
    "start_time": "2019-06-27T13:48:11.000Z",
    "start_time_local": "2019-06-27T13:48:11.000Z",
    "type": "MobileSession",
    "updated_at": "2019-07-01T16:04:59.000Z",
    "url_token": "1rpdv",
    "user_id": 2,
    "uuid": "89a83844-6a07-483d-8b4b-9c0903eeef2b",
    "notes": [],
    "streams": {
      "AirBeam2-PM2.5": {
        "average_value": 5.86654,
        "id": 329904,
        "max_latitude": 40.6804351,
        "max_longitude": -73.9722257,
        "measurement_short_type": "PM",
        "measurement_type": "Particulate Matter",
        "measurements_count": 517,
        "min_latitude": 40.6769462,
        "min_longitude": -73.9763078,
        "sensor_name": "AirBeam2-PM2.5",
        "sensor_package_name": "AirBeam2:00189610719F",
        "session_id": 94192,
        "size": 517,
        "start_latitude": 40.6769462,
        "start_longitude": -73.9722298,
        "threshold_high": 55,
        "threshold_low": 12,
        "threshold_medium": 35,
        "threshold_very_high": 150,
        "threshold_very_low": 0,
        "unit_name": "micrograms per cubic meter",
        "unit_symbol": "µg/m³",
        "measurements": [
          {
            "value": 7.0,
            "latitude": 40.6769462,
            "longitude": -73.9722298,
            "time": "2019-06-27T13:48:12.000Z"
          }
        ]
      }
    }
  }
  ```

# Measurements

Returns measurements for a given stream id.

**Endpoint**

GET `/api/measurements.json`

**Parameters**

| name       | type   | required | default value |
| :--------- | :----- | :------- | :------------ |
| stream_ids | number | yes      | N/A           |
| start_time | number | no       | 0             |
| end_time   | number | no       | current time  |

**Example**

- request

  ```
  curl http://aircasting.habitatmap.org/api/measurements.json/?end_time=2281550369000&start_time=0&stream_ids=1
  ```

- response

  ```json
  [
    {
      "time": "2011-12-16T22:23:02Z",
      "value": 58.2103,
      "latitude": 50.05822535,
      "longitude": 19.926092562
    },
    {
      "time": "2011-12-16T22:23:03Z",
      "value": 58.977,
      "latitude": 50.05822535,
      "longitude": 19.926092562
    }
  ]
  ```

# Single session stream

**Endpoint**

GET `/api/fixed/sessions/{sessionID}.json`

ex. {sessionID} --> 1758913
To get the measurements from the given stream. It will be using sessionID.

**Parameters**

| name               | type   | required | default value |
| :----------------- | :----- | :------- | :------------ |
| sensor_name        | number | yes      | N/A           |
| measurements_limit | number | no       | N/A           |

**Example**

- request

  ```json
   http://aircasting.habitatmap.org/api/fixed/sessions/1758913.json?measurements_limit=14&sensor_name=airbeam3-pm2.5
  ```

- response

  ```json
  {
    "title": "HabitatMap HQ",
    "username": "HabitatMap",
    "sensorName": "AirBeam3-PM2.5",
    "measurements": [
      {
        "value": 0.0,
        "time": 1650884234000,
        "longitude": -73.976356946,
        "latitude": 40.680268333
      }
    ],
    "startTime": 1649068083000,
    "endTime": 1650884234000,
    "id": 1758913,
    "streamId": 2207995,
    "sensorUnit": "µg/m³",
    "latitude": 40.680268333,
    "longitude": -73.976356946,
    "maxLatitude": 40.680268333,
    "maxLongitude": -73.976356946,
    "minLatitude": 40.680268333,
    "minLongitude": -73.976356946,
    "notes": [],
    "isIndoor": false,
    "lastMeasurementValue": 0.0,
    "threshold_very_high": 100,
    "threshold_high": 80,
    "threshold_medium": 60,
    "threshold_low": 40,
    "threshold_very_low": 20,
    "unit_name": "µg/m³",
    "measurement_short_type": "PM",
    "measurement_type": "Particulate Matter"
  }
  ```

# All session streams

**Endpoint**

GET `/api/fixed/sessions/{sessionID}/streams.json`

ex. {sessionID} --> 1758913
To get the measurements from all streams of the given session. It will be using sessionID.

**Parameters**

| name               | type   | required | default value |
| :----------------- | :----- | :------- | :------------ |
| measurements_limit | number | no       | N/A           |

**Example**

- request

  ```json
   http://aircasting.habitatmap.org/api/fixed/sessions/1758913/streams.json?measurements_limit=14
  ```

- response

  ```json
  {
    "id": 1758913,
    "start_time": 1649068083000,
    "end_time": 1650884234000,
    "title": "HabitatMap HQ",
    "username": "HabitatMap",
    "latitude": 40.680268333,
    "longitude": -73.976356946,
    "is_indoor": false,
    "notes": [],
    "streams": [
      {
        "sensor_name": "AirBeam3-PM2.5",
        "stream_id": 2207995,
        "sensor_unit": "µg/m³",
        "max_latitude": 40.680268333,
        "max_longitude": -73.976356946,
        "min_latitude": 40.680268333,
        "min_longitude": -73.976356946,
        "last_measurement_value": 0.0,
        "threshold_very_high": 100,
        "threshold_high": 80,
        "threshold_medium": 60,
        "threshold_low": 40,
        "threshold_very_low": 20,
        "unit_name": "µg/m³",
        "measurement_short_type": "PM",
        "measurement_type": "Particulate Matter",
        "measurements": [
          {
            "value": 0.0,
            "time": 1650884234000,
            "longitude": -73.976356946,
            "latitude": 40.680268333
          }
        ]
      }
    ]
  }
  ```

# Averages

**Endpoint**

GET `/api/averages2`

To get multiple average values for polygons in a region. You need to pass a list of stream ids otherwise nothing will be returned.

**Parameters**

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
| stream_ids       | list number       | empty list    |

See [parameters description](#parameters-description)

**Example**

- request

  ```json
   http://aircasting.habitatmap.org/api/averages2.json?q={"west":-74.56264303613284,"east":-73.41594503808597,"south":40.48145815185845,"north":40.82735151191054,"time_from":"1531612800","time_to":"1563235199","grid_size_x":113.78612716763006,"grid_size_y":31,"tags":"","usernames":"HabitatMap","sensor_name":"airbeam2-pm2.5","measurement_type":"Particulate Matter","unit_symbol":"µg/m³","stream_ids":[94192,94178,91439,90868,90850,90837,89516,89490,78011,78010,77712,76780,76770,75193,71641,67139,67096,64047,64042,64031]}
  ```

- encoded request
  ```
  curl  http://aircasting.habitatmap.org/api/averages2.json?q=%7B%22west%22:-74.56264303613284,%22east%22:-73.41594503808597,%22south%22:40.48145815185845,%22north%22:40.82735151191054,%22time_from%22:%221531612800%22,%22time_to%22:%221563235199%22,%22grid_size_x%22:113.78612716763006,%22grid_size_y%22:31,%22tags%22:%22%22,%22usernames%22:%22HabitatMap%22,%22sensor_name%22:%22airbeam2-pm2.5%22,%22measurement_type%22:%22Particulate+Matter%22,%22unit_symbol%22:%22%C2%B5g%2Fm%C2%B3%22,%22stream_ids%22:%5B94192,94178,91439,90868,90850,90837,89516,89490,78011,78010,77712,76780,76770,75193,71641,67139,67096,64047,64042,64031%5D%7D
  ```
- response

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
    }
  ]
  ```

# Region

This will let you fetch the average measured value for a region of the map specified by the `east`, `west`, `north` and `south` parameters. Also pass the `measurement_type` and `sensor_name` parameters to specify the measurements you want the average of. You need to pass a list of stream ids otherwise nothing will be returned.

**Endpoint**

GET `/api/region`

**Parameters**

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
| stream_ids       | list number       | empty list    |

See [parameters description](#parameters-description)

**Example**

- request
  ```json
  http://aircasting.habitatmap.org/api/region.json?q={"west":-73.98231641381187,"east":-73.97216864391766,"south":40.68332674082153,"north":40.69643137175753,"time_from":"1531612800","time_to":"1563235199","grid_size_x":113.78612716763006,"grid_size_y":31,"tags":"","usernames":"HabitatMap","sensor_name":"airbeam2-pm2.5","measurement_type":"Particulate Matter","unit_symbol":"µg/m³","stream_ids":[94192,94178,91439,90868,90850,90837,89516,89490,78011,78010,77712,76780,76770,75193,71641,67139,67096,64047,64042,64031]}
  ```
- encoded request

  ```
  curl http://aircasting.habitatmap.org/api/region.json\?q\=%7B%22west%22%3A-73.98231641381187%2C%22east%22%3A-73.97216864391766%2C%22south%22%3A40.68332674082153%2C%22north%22%3A40.69643137175753%2C%22time_from%22%3A%221531612800%22%2C%22time_to%22%3A%221563235199%22%2C%22grid_size_x%22%3A113.78612716763006%2C%22grid_size_y%22%3A31%2C%22tags%22%3A%22%22%2C%22usernames%22%3A%22HabitatMap%22%2C%22sensor_name%22%3A%22airbeam2-pm2.5%22%2C%22measurement_type%22%3A%22Particulate%20Matter%22%2C%22unit_symbol%22%3A%22%C2%B5g%2Fm%C2%B3%22%2C%22stream_ids%22%3A%5B94192%2C94178%2C91439%2C90868%2C90850%2C90837%2C89516%2C89490%2C78011%2C78010%2C77712%2C76780%2C76770%2C75193%2C71641%2C67139%2C67096%2C64047%2C64042%2C64031%5D%7D
  ```

  See [how to encode URLs](#how-to-encode-urls)

- response

  ```json
  {
    "average": 7.47753927860146,
    "number_of_contributors": 1,
    "number_of_samples": 4519
  }
  ```

# Last Session

**Endpoint**

GET `/api/v2/data/sessions/last`

**Example**

- request

  ```
  curl http://aircasting.habitatmap.org/api/v2/data/sessions/last.json
  ```

- response

  ```json
  { "id": 10105 }
  ```

# Parameters description

Notice: your query will not return any results unless you provide all required parameters.

- **west, east, south, north**

  All four have to be provided. If one is missing results will not be filtered by location.

- **limit, offset**

  Limit indicates the number of results to fetch. Offset is useful if you want to fetch data in batches. For example one can set limit to 50 and offset to 0 to fetch the first batch. Then set limit to 50 and offset to 50 to get the next batch.

- **time_from, time_to**

  - `time_from` and `time_to` should be passed as seconds since epoch.
  - They should be expressed in UTC.
  - Date and time of the day are separate filters. This means that selecting `q[time_from]=1559372400` and `q[time_to]=1559559600` which corresponds to June 1, 2019 **7 AM** - June 3, 2019 **11 AM** will return sessions that were recording in the morning during these 3 days.
  - To see all session from that period use June 1, 2019 12:00:00 AM - June 3, 2019 11:59:59 PM.
  - Every session that has at least one measurement in the selected time range will be included in the results.

- **sensor_name, measurement_type, unit_symbol**

  All three are considered together. This means that only result that match all of them will be returned.

# FAQ

### How to encode URLs

You can use an online URL encoder to transform the JSON part. For example to encode

`http://example.com?q={"name":"value"}`

encode the JSON part:

`'{"name":"value"}'` => `%7B%22name%22%3A%22value%22%7D`

then you can use the URL with curl command:

`curl http://example.com\?q\=%7B%22name%22%3A%22value%22%7D`

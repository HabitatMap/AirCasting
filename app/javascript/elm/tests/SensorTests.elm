module SensorTests exposing (all)

import Expect
import Fuzz exposing (int, list, string)
import Json.Encode as Encode
import Sensor exposing (..)
import Test exposing (..)


all : Test
all =
    describe "all:"
        [ test "decodeSensors returns a list of sensors" <|
            \_ ->
                let
                    encodedValue =
                        Encode.list Encode.object
                            [ [ ( "measurement_type", Encode.string "parameter" )
                              , ( "sensor_name", Encode.string "Sensor" )
                              , ( "unit_symbol", Encode.string "unit" )
                              , ( "session_count", Encode.int 1 )
                              ]
                            , [ ( "measurement_type", Encode.string "parameter" )
                              , ( "sensor_name", Encode.string "Sensor2" )
                              , ( "unit_symbol", Encode.string "unit" )
                              , ( "session_count", Encode.int 2 )
                              ]
                            , [ ( "measurement_type", Encode.string "parameter2" )
                              , ( "sensor_name", Encode.string "Sensor3" )
                              , ( "unit_symbol", Encode.string "unit" )
                              , ( "session_count", Encode.int 1 )
                              ]
                            ]
                in
                encodedValue
                    |> decodeSensors
                    |> Expect.equal sensors
        , test "idForParameterOrLabel finds sensorId for parameter" <|
            \_ ->
                sensors
                    |> idForParameterOrLabel "parameter2" "parameter-sensor (unit)"
                    |> Expect.equal "parameter2-sensor3 (unit)"
        , test "idForParameterOrLabel finds sensorId for sensor label" <|
            \_ ->
                sensors
                    |> idForParameterOrLabel "Sensor2 (unit)" "parameter-sensor (unit)"
                    |> Expect.equal "parameter-sensor2 (unit)"
        , test "idForParameterOrLabel finds sensorId with highest sessions count for parameter" <|
            \_ ->
                sensors
                    |> idForParameterOrLabel "parameter" "parameter2-sensor3 (unit)"
                    |> Expect.equal "parameter-sensor2 (unit)"
        , test "idForParameterOrLabel always finds airbeam2-pm2.5 for Particulate Matter" <|
            \_ ->
                [ { id_ = "Particulate Matter-other label (µg/m³)"
                  , parameter = "Particulate Matter"
                  , label = "Other Label (µg/m³)"
                  , name = "Other Label"
                  , unit = "µg/m³"
                  , session_count = 1
                  }
                , { id_ = "Particulate Matter-airbeam2-pm2.5 (µg/m³)"
                  , parameter = "Particulate Matter"
                  , label = "AirBeam2-PM2.5 (µg/m³)"
                  , name = "AirBeam2-PM2.5"
                  , unit = "µg/m³"
                  , session_count = 0
                  }
                ]
                    |> idForParameterOrLabel "Particulate Matter" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Particulate Matter-airbeam2-pm2.5 (µg/m³)"
        , test "idForParameterOrLabel always finds airbeam2-rh for Humidity" <|
            \_ ->
                [ { id_ = "Humidity-other label (%)"
                  , parameter = "Humidity"
                  , label = "Other Label (%)"
                  , name = "Other Label"
                  , unit = "%"
                  , session_count = 1
                  }
                , { id_ = "Humidity-airbeam2-rh (%)"
                  , parameter = "Humidity"
                  , label = "AirBeam2-RH (%)"
                  , name = "AirBeam2-RH"
                  , unit = "%"
                  , session_count = 0
                  }
                ]
                    |> idForParameterOrLabel "Humidity" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Humidity-airbeam2-rh (%)"
        , test "idForParameterOrLabel always finds phone microphone for Sound Levels" <|
            \_ ->
                [ { id_ = "Sound Level-other label (dB)"
                  , parameter = "Sound Level"
                  , label = "Other Label (dB)"
                  , name = "Other Label"
                  , unit = "dB"
                  , session_count = 1
                  }
                , { id_ = "Sound Level-phone microphone (dB)"
                  , parameter = "Sound Level"
                  , label = "Phone Microphone (dB)"
                  , name = "Phone Microphone"
                  , unit = "dB"
                  , session_count = 0
                  }
                ]
                    |> idForParameterOrLabel "Sound Level" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Sound Level-phone microphone (dB)"
        , test "idForParameterOrLabel always finds airbeam2-f for Temperature" <|
            \_ ->
                [ { id_ = "Temperature-other label (F)"
                  , parameter = "Temperature"
                  , label = "Other Label (F)"
                  , name = "Other Label"
                  , unit = "F"
                  , session_count = 1
                  }
                , { id_ = "Temperature-airbeam2-f (F)"
                  , parameter = "Temperature"
                  , label = "Temperature (F)"
                  , name = "Temperature"
                  , unit = "F"
                  , session_count = 0
                  }
                ]
                    |> idForParameterOrLabel "Temperature" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Temperature-airbeam2-f (F)"
        , test "when the default is missing idForParameterOrLabel returns airbeam2-pm2.5" <|
            \_ ->
                []
                    |> idForParameterOrLabel "Temperature" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Particulate Matter-airbeam2-pm2.5 (µg/m³)"
        , test "labelsForParameter returns labels divided into main and others" <|
            \_ ->
                "Particulate Matter-airbeam2-pm2.5 (µg/m³)"
                    |> labelsForParameter sensorsWithPriority
                    |> Expect.equal
                        ( [ "AirBeam2-PM2.5 (µg/m³)"
                          , "AirBeam2-PM1 (µg/m³)"
                          , "AirBeam2-PM10 (µg/m³)"
                          , "AirBeam-PM (µg/m³)"
                          ]
                        , [ "Other Label (µg/m³)" ]
                        )
        , test "nameForSensorId returns the name given the sensorId" <|
            \_ ->
                [ { sensor
                    | id_ = "id"
                    , name = "name"
                  }
                , { sensor
                    | id_ = "other id"
                    , name = "other name"
                  }
                ]
                    |> nameForSensorId "id"
                    |> Expect.equal (Just "name")
        , test "unitForSensorId returns the unit given the sensorId" <|
            \_ ->
                [ { sensor
                    | id_ = "id"
                    , unit = "unit"
                  }
                , { sensor
                    | id_ = "other id"
                    , unit = "other unit"
                  }
                ]
                    |> unitForSensorId "id"
                    |> Expect.equal (Just "unit")
        ]


sensor : Sensor
sensor =
    { id_ = "parameter-sensor (unit)"
    , parameter = "parameter"
    , label = "Sensor (unit)"
    , name = "Sensor"
    , unit = "unit"
    , session_count = 1
    }


sensors : List Sensor
sensors =
    [ { id_ = "parameter-sensor (unit)"
      , parameter = "parameter"
      , label = "Sensor (unit)"
      , name = "Sensor"
      , unit = "unit"
      , session_count = 1
      }
    , { id_ = "parameter-sensor2 (unit)"
      , parameter = "parameter"
      , label = "Sensor2 (unit)"
      , name = "Sensor2"
      , unit = "unit"
      , session_count = 2
      }
    , { id_ = "parameter2-sensor3 (unit)"
      , parameter = "parameter2"
      , label = "Sensor3 (unit)"
      , name = "Sensor3"
      , unit = "unit"
      , session_count = 1
      }
    ]


sensorsWithPriority : List Sensor
sensorsWithPriority =
    [ { id_ = "Particulate Matter-airbeam2-pm2.5 (µg/m³)"
      , parameter = "Particulate Matter"
      , label = "AirBeam2-PM2.5 (µg/m³)"
      , name = "AirBeam2-PM2.5"
      , unit = "µg/m³"
      , session_count = 1
      }
    , { id_ = "Particulate Matter-airbeam2-pm1 (µg/m³)"
      , parameter = "Particulate Matter"
      , label = "AirBeam2-PM1 (µg/m³)"
      , name = "AirBeam2-PM1"
      , unit = "µg/m³"
      , session_count = 1
      }
    , { id_ = "Particulate Matter-airbeam2-pm10 (µg/m³)"
      , parameter = "Particulate Matter"
      , label = "AirBeam2-PM10 (µg/m³)"
      , name = "AirBeam2-PM10"
      , unit = "µg/m³"
      , session_count = 1
      }
    , { id_ = "Particulate Matter-airbeam-pm (µg/m³)"
      , parameter = "Particulate Matter"
      , label = "AirBeam-PM (µg/m³)"
      , name = "AirBeam-PM"
      , unit = "µg/m³"
      , session_count = 1
      }
    , { id_ = "Particulate Matter-other label (µg/m³)"
      , parameter = "Particulate Matter"
      , label = "Other Label (µg/m³)"
      , name = "Other Label"
      , unit = "µg/m³"
      , session_count = 1
      }
    ]

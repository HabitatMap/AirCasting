module SensorTests exposing (all)

import Expect
import Fuzz exposing (int, string)
import Json.Decode as Decode
import Json.Encode as Encode
import Result exposing (Result(..))
import Sensor exposing (..)
import Test exposing (..)


all : Test
all =
    describe "all:"
        [ test "decoder decodes a sensor" <|
            \_ ->
                let
                    encodedValue =
                        Encode.object
                            [ ( "measurement_type", Encode.string "parameter" )
                            , ( "sensor_name", Encode.string "Sensor" )
                            , ( "unit_symbol", Encode.string "unit" )
                            , ( "session_count", Encode.int 1 )
                            ]

                    expected =
                        { parameter = "parameter"
                        , name = "Sensor"
                        , unit = "unit"
                        , session_count = 1
                        }
                in
                encodedValue
                    |> Decode.decodeValue decoder
                    |> Expect.equal (Ok expected)
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
                [ { parameter = "Particulate Matter"
                  , name = "Other Label"
                  , unit = "µg/m³"
                  , session_count = 1
                  }
                , { parameter = "Particulate Matter"
                  , name = "AirBeam2-PM2.5"
                  , unit = "µg/m³"
                  , session_count = 0
                  }
                ]
                    |> idForParameterOrLabel "Particulate Matter" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Particulate Matter-airbeam2-pm2.5 (µg/m³)"
        , test "idForParameterOrLabel always finds airbeam2-rh for Humidity" <|
            \_ ->
                [ { parameter = "Humidity"
                  , name = "Other Label"
                  , unit = "%"
                  , session_count = 1
                  }
                , { parameter = "Humidity"
                  , name = "AirBeam2-RH"
                  , unit = "%"
                  , session_count = 0
                  }
                ]
                    |> idForParameterOrLabel "Humidity" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Humidity-airbeam2-rh (%)"
        , test "idForParameterOrLabel always finds phone microphone for Sound Levels" <|
            \_ ->
                [ { parameter = "Sound Level"
                  , name = "Other Label"
                  , unit = "dB"
                  , session_count = 1
                  }
                , { parameter = "Sound Level"
                  , name = "Phone Microphone"
                  , unit = "dB"
                  , session_count = 0
                  }
                ]
                    |> idForParameterOrLabel "Sound Level" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Sound Level-phone microphone (dB)"
        , test "idForParameterOrLabel always finds airbeam2-f for Temperature" <|
            \_ ->
                [ { parameter = "Temperature"
                  , name = "Other Label"
                  , unit = "F"
                  , session_count = 1
                  }
                , { parameter = "Temperature"
                  , name = "AirBeam2-F"
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
                let
                    sensor1 =
                        { sensor | name = "name" }

                    sensor2 =
                        { sensor | name = "other name" }
                in
                [ sensor1, sensor2 ]
                    |> nameForSensorId (toId sensor1)
                    |> Expect.equal (Just "name")
        , test "unitForSensorId returns the unit given the sensorId" <|
            \_ ->
                let
                    sensor1 =
                        { sensor | unit = "unit" }

                    sensor2 =
                        { sensor | unit = "other unit" }
                in
                [ sensor1, sensor2 ]
                    |> unitForSensorId (toId sensor1)
                    |> Expect.equal (Just "unit")
        ]


sensor : Sensor
sensor =
    { parameter = "parameter"
    , name = "Sensor"
    , unit = "unit"
    , session_count = 1
    }


sensors : List Sensor
sensors =
    [ { parameter = "parameter"
      , name = "Sensor"
      , unit = "unit"
      , session_count = 1
      }
    , { parameter = "parameter"
      , name = "Sensor2"
      , unit = "unit"
      , session_count = 2
      }
    , { parameter = "parameter2"
      , name = "Sensor3"
      , unit = "unit"
      , session_count = 1
      }
    ]


sensorsWithPriority : List Sensor
sensorsWithPriority =
    [ { parameter = "Particulate Matter"
      , name = "AirBeam2-PM2.5"
      , unit = "µg/m³"
      , session_count = 1
      }
    , { parameter = "Particulate Matter"
      , name = "AirBeam2-PM1"
      , unit = "µg/m³"
      , session_count = 1
      }
    , { parameter = "Particulate Matter"
      , name = "AirBeam2-PM10"
      , unit = "µg/m³"
      , session_count = 1
      }
    , { parameter = "Particulate Matter"
      , name = "AirBeam-PM"
      , unit = "µg/m³"
      , session_count = 1
      }
    , { parameter = "Particulate Matter"
      , name = "Other Label"
      , unit = "µg/m³"
      , session_count = 1
      }
    ]

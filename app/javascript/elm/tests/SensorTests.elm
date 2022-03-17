module SensorTests exposing (all)

import Data.Page exposing (Page(..))
import Expect
import Fuzz exposing (Fuzzer, constant, oneOf)
import Json.Decode as Decode
import Json.Encode as Encode
import Result exposing (Result(..))
import Sensor exposing (..)
import Test exposing (..)


pageFuzzer : Fuzzer Page
pageFuzzer =
    oneOf [ constant Mobile, constant Fixed ]


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
                        , sessionCount = 1
                        }
                in
                encodedValue
                    |> Decode.decodeValue decoder
                    |> Expect.equal (Ok expected)
        , fuzz pageFuzzer "idForParameterOrLabel finds sensorId for parameter" <|
            \page ->
                sensors
                    |> idForParameterOrLabel page "parameter2" "parameter-sensor (unit)"
                    |> Expect.equal "parameter2-sensor3 (unit)"
        , fuzz pageFuzzer "idForParameterOrLabel finds sensorId for sensor label" <|
            \page ->
                sensors
                    |> idForParameterOrLabel page "Sensor2 (unit)" "parameter-sensor (unit)"
                    |> Expect.equal "parameter-sensor2 (unit)"
        , fuzz pageFuzzer "idForParameterOrLabel finds sensorId with highest sessions count for parameter" <|
            \page ->
                sensors
                    |> idForParameterOrLabel page "parameter" "parameter2-sensor3 (unit)"
                    |> Expect.equal "parameter-sensor2 (unit)"
        , test "when on mobile page idForParameterOrLabel always finds airbeam-pm2.5 for Particulate Matter" <|
            \_ ->
                [ { parameter = "Particulate Matter"
                  , name = "Other Label"
                  , unit = "µg/m³"
                  , sessionCount = 1
                  }
                , { parameter = "Particulate Matter"
                  , name = "AirBeam-PM2.5"
                  , unit = "µg/m³"
                  , sessionCount = 0
                  }
                ]
                    |> idForParameterOrLabel Mobile "Particulate Matter" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Particulate Matter-airbeam-pm2.5 (µg/m³)"
        , fuzz pageFuzzer "idForParameterOrLabel always finds airbeam-rh for Humidity" <|
            \page ->
                [ { parameter = "Humidity"
                  , name = "Other Label"
                  , unit = "%"
                  , sessionCount = 1
                  }
                , { parameter = "Humidity"
                  , name = "AirBeam-RH"
                  , unit = "%"
                  , sessionCount = 0
                  }
                ]
                    |> idForParameterOrLabel page "Humidity" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Humidity-airbeam-rh (%)"
        , fuzz pageFuzzer "idForParameterOrLabel always finds phone microphone for Sound Levels" <|
            \page ->
                [ { parameter = "Sound Level"
                  , name = "Other Label"
                  , unit = "dB"
                  , sessionCount = 1
                  }
                , { parameter = "Sound Level"
                  , name = "Phone Microphone"
                  , unit = "dB"
                  , sessionCount = 0
                  }
                ]
                    |> idForParameterOrLabel page "Sound Level" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Sound Level-phone microphone (dB)"
        , fuzz pageFuzzer "idForParameterOrLabel always finds airbeam-f for Temperature" <|
            \page ->
                [ { parameter = "Temperature"
                  , name = "Other Label"
                  , unit = "F"
                  , sessionCount = 1
                  }
                , { parameter = "Temperature"
                  , name = "AirBeam-F"
                  , unit = "F"
                  , sessionCount = 0
                  }
                ]
                    |> idForParameterOrLabel page "Temperature" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Temperature-airbeam-f (F)"
        , test "when on mobile page and the default is missing idForParameterOrLabel returns airbeam-pm2.5" <|
            \_ ->
                []
                    |> idForParameterOrLabel Mobile "Temperature" "parameter2-sensor3 (unit)"
                    |> Expect.equal "Particulate Matter-airbeam-pm2.5 (µg/m³)"
        , test "labelsForParameter returns labels divided into main (always included) and others" <|
            \_ ->
                let
                    sensors_ =
                        [ { parameter = "Particulate Matter"
                          , name = "AirBeam-PM2.5"
                          , unit = "µg/m³"
                          , sessionCount = 1
                          }
                        ]
                in
                "Particulate Matter-airbeam-pm2.5 (µg/m³)"
                    |> labelsForParameter Fixed sensors_
                    |> Expect.equal
                        ( [ "AirBeam-PM10 (µg/m³)"
                          , "AirBeam-PM2.5 (µg/m³)"
                          , "AirBeam-PM1 (µg/m³)"
                          , "OpenAQ-PM2.5 (µg/m³)"
                          , "PurpleAir-PM2.5 (µg/m³)"
                          ]
                        , []
                        )
        , test "labelsForParameter for mobile considers OpenAQ as not main" <|
            \_ ->
                let
                    sensors_ =
                        [ { parameter = "Particulate Matter"
                          , name = "AirBeam-PM2.5"
                          , unit = "µg/m³"
                          , sessionCount = 1
                          }
                        , { parameter = "Particulate Matter"
                          , name = "OpenAQ-PM2.5"
                          , unit = "µg/m³"
                          , sessionCount = 1
                          }
                        ]
                in
                "Particulate Matter-airbeam-pm2.5 (µg/m³)"
                    |> labelsForParameter Mobile sensors_
                    |> Expect.equal
                        ( [ "AirBeam-PM10 (µg/m³)"
                          , "AirBeam-PM2.5 (µg/m³)"
                          , "AirBeam-PM1 (µg/m³)"
                          ]
                        , [ "OpenAQ-PM2.5 (µg/m³)" ]
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
    , sessionCount = 1
    }


sensors : List Sensor
sensors =
    [ { parameter = "parameter"
      , name = "Sensor"
      , unit = "unit"
      , sessionCount = 1
      }
    , { parameter = "parameter"
      , name = "Sensor2"
      , unit = "unit"
      , sessionCount = 2
      }
    , { parameter = "parameter2"
      , name = "Sensor3"
      , unit = "unit"
      , sessionCount = 1
      }
    ]

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
        , test "sensorLabelsForParameterInId finds all sensors for parameter" <|
            \_ ->
                "parameter-sensor (unit)"
                    |> sensorLabelsForParameterInId sensors
                    |> Expect.equal [ "Sensor (unit)", "Sensor2 (unit)" ]
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
        , test "sensorsLabelsForIdWithPrioritization returns labels divided into main and others" <|
            \_ ->
                "Particulate Matter-airbeam2-pm2.5 (µg/m³)"
                    |> sensorsLabelsForIdWithPrioritization sensorsWithPriority
                    |> Expect.equal
                        { main =
                            [ "AirBeam2-PM2.5 (µg/m³)"
                            , "AirBeam2-PM1 (µg/m³)"
                            , "AirBeam2-PM10 (µg/m³)"
                            , "AirBeam-PM (µg/m³)"
                            ]
                        , others = [ "Other Label (µg/m³)" ]
                        }
        ]


sensors : List Sensor
sensors =
    [ { id_ = "parameter-sensor (unit)"
      , parameter = "parameter"
      , label = "Sensor (unit)"
      , sensor = "Sensor"
      , unit = "unit"
      , session_count = 1
      }
    , { id_ = "parameter-sensor2 (unit)"
      , parameter = "parameter"
      , label = "Sensor2 (unit)"
      , sensor = "Sensor2"
      , unit = "unit"
      , session_count = 2
      }
    , { id_ = "parameter2-sensor3 (unit)"
      , parameter = "parameter2"
      , label = "Sensor3 (unit)"
      , sensor = "Sensor3"
      , unit = "unit"
      , session_count = 1
      }
    ]


sensorsWithPriority : List Sensor
sensorsWithPriority =
    [ { id_ = "Particulate Matter-airbeam2-pm2.5 (µg/m³)"
      , parameter = "Particulate Matter"
      , label = "AirBeam2-PM2.5 (µg/m³)"
      , sensor = "AirBeam2-PM2.5"
      , unit = "µg/m³"
      , session_count = 1
      }
    , { id_ = "Particulate Matter-airbeam2-pm1 (µg/m³)"
      , parameter = "Particulate Matter"
      , label = "AirBeam2-PM1 (µg/m³)"
      , sensor = "AirBeam2-PM1"
      , unit = "µg/m³"
      , session_count = 1
      }
    , { id_ = "Particulate Matter-airbeam2-pm10 (µg/m³)"
      , parameter = "Particulate Matter"
      , label = "AirBeam2-PM10 (µg/m³)"
      , sensor = "AirBeam2-PM10"
      , unit = "µg/m³"
      , session_count = 1
      }
    , { id_ = "Particulate Matter-airbeam-pm (µg/m³)"
      , parameter = "Particulate Matter"
      , label = "AirBeam-PM (µg/m³)"
      , sensor = "AirBeam-PM"
      , unit = "µg/m³"
      , session_count = 1
      }
    , { id_ = "Particulate Matter-other label (µg/m³)"
      , parameter = "Particulate Matter"
      , label = "Other Label (µg/m³)"
      , sensor = "Other Label"
      , unit = "µg/m³"
      , session_count = 1
      }
    ]

module SensorsTests exposing (all)

import Expect
import Fuzz exposing (bool, int, intRange, list, string)
import Json.Encode as Encode
import Sensors exposing (..)
import Test exposing (..)
import Test.Html.Event as Event
import Test.Html.Query as Query
import Test.Html.Selector as Slc


all : Test
all =
    describe "all:"
        [ test "decodeParameterSensorPairs return a list of parameter-sensor pairs" <|
            \_ ->
                let
                    encodedValue =
                        Encode.list Encode.object
                            [ [ ( "measurement_type", Encode.string "parameter" )
                              , ( "sensor_name", Encode.string "Sensor" )
                              , ( "unit_symbol", Encode.string "unit" )
                              ]
                            , [ ( "measurement_type", Encode.string "parameter" )
                              , ( "sensor_name", Encode.string "Sensor2" )
                              , ( "unit_symbol", Encode.string "unit" )
                              ]
                            , [ ( "measurement_type", Encode.string "parameter2" )
                              , ( "sensor_name", Encode.string "Sensor3" )
                              , ( "unit_symbol", Encode.string "unit" )
                              ]
                            ]
                in
                encodedValue
                    |> decodeParameterSensorPairs
                    |> Expect.equal parameterSensorPairs
        , test "labelsForParameterInId finds all sensors for parameter" <|
            \_ ->
                "parameter-sensor (unit)"
                    |> labelsForParameterInId parameterSensorPairs
                    |> Expect.equal [ "Sensor (unit)", "Sensor2 (unit)" ]
        , test "idForParameterOrLabel finds sensorId for parameter" <|
            \_ ->
                parameterSensorPairs
                    |> idForParameterOrLabel "parameter2" "parameter-sensor (unit)"
                    |> Expect.equal "parameter2-sensor3 (unit)"
        , test "idForParameterOrLabel finds sensorId for sensor label" <|
            \_ ->
                parameterSensorPairs
                    |> idForParameterOrLabel "Sensor2 (unit)" "parameter-sensor (unit)"
                    |> Expect.equal "parameter-sensor2 (unit)"
        ]


parameterSensorPairs =
    [ { id_ = "parameter-sensor (unit)"
      , parameter = "parameter"
      , label = "Sensor (unit)"
      , sensor = "Sensor"
      , unit = "unit"
      }
    , { id_ = "parameter-sensor2 (unit)"
      , parameter = "parameter"
      , label = "Sensor2 (unit)"
      , sensor = "Sensor2"
      , unit = "unit"
      }
    , { id_ = "parameter2-sensor3 (unit)"
      , parameter = "parameter2"
      , label = "Sensor3 (unit)"
      , sensor = "Sensor3"
      , unit = "unit"
      }
    ]

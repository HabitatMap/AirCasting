module SensorsTests exposing (all)

import Expect
import Fuzz exposing (bool, int, intRange, list, string)
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
                -- todo
                Expect.equal [] []
        , test "allSensorsForParameter finds all sensors for parameter" <|
            \_ ->
                let
                    parameterSensorPairs =
                        [ { parameter = "parameter", label = "label1" }
                        , { parameter = "parameter", label = "label2" }
                        , { parameter = "parameter2", label = "label3" }
                        ]
                in
                "parameter"
                    |> allSensorsForParameter parameterSensorPairs
                    |> Expect.equal [ "label1", "label2" ]
        ]

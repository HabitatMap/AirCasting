module Data.HeatMapThresholdsTests exposing (suite)

import Data.HeatMapThresholds exposing (extremes, updateMaximum, updateMinimum)
import Expect
import Fuzz exposing (int, list, string)
import Json.Encode as Encode
import Sensor exposing (..)
import Test exposing (..)


suite : Test
suite =
    describe "Data.HeatMapThresholds"
        [ fuzz2 int int "updateMinimum, updateMaximum and extremes" <|
            \threshold1 threshold5 ->
                let
                    thresholds =
                        { threshold1 = 1, threshold2 = 2, threshold3 = 3, threshold4 = 4, threshold5 = 5 }

                    expected =
                        { thresholds | threshold1 = threshold1, threshold5 = threshold5 }
                in
                thresholds
                    |> updateMinimum threshold1
                    |> updateMaximum threshold5
                    |> Expect.equal expected
        ]

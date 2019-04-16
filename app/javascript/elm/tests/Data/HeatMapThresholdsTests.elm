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
            \h1 h5 ->
                let
                    thresholds =
                        { h1 = 1, h2 = 2, h3 = 3, h4 = 4, h5 = 5 }

                    expected =
                        { thresholds | h1 = h1, h5 = h5 }
                in
                thresholds
                    |> updateMinimum h1
                    |> updateMaximum h5
                    |> Expect.equal expected
        ]

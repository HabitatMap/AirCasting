module Data.HeatMapThresholdsTests exposing (suite)

import Data.HeatMapThresholds exposing (HeatMapThresholds, Threshold, toValues, updateMaximum, updateMinimum)
import Expect
import Fuzz exposing (int)
import Test exposing (..)


defaultThreshold : Threshold
defaultThreshold =
    { value = 1, default = 2 }


thresholds : HeatMapThresholds
thresholds =
    { threshold1 = defaultThreshold
    , threshold2 = defaultThreshold
    , threshold3 = defaultThreshold
    , threshold4 = defaultThreshold
    , threshold5 = defaultThreshold
    }


suite : Test
suite =
    describe "Data.HeatMapThresholds"
        [ fuzz2 int int "updateMinimum, updateMaximum and extremes" <|
            \threshold1 threshold5 ->
                let
                    values =
                        toValues thresholds

                    expected =
                        { values | threshold1 = threshold1, threshold5 = threshold5 }
                in
                thresholds
                    |> updateMinimum threshold1
                    |> updateMaximum threshold5
                    |> toValues
                    |> Expect.equal expected
        ]

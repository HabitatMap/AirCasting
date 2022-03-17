module Data.HeatMapThresholdsTests exposing (suite)

import Data.HeatMapThresholds exposing (HeatMapThresholds, fitThresholds, toValues, updateMaximum, updateMinimum)
import Expect
import Test exposing (..)


thresholds : HeatMapThresholds
thresholds =
    { threshold1 = { value = 1, default = 2 }
    , threshold2 = { value = 2, default = 2 }
    , threshold3 = { value = 3, default = 2 }
    , threshold4 = { value = 4, default = 2 }
    , threshold5 = { value = 5, default = 2 }
    }


suite : Test
suite =
    describe "Data.HeatMapThresholds"
        [ test "updateMinimum adjusts other thresholds if they are smaller than the new value" <|
            \_ ->
                thresholds
                    |> updateMinimum 6
                    |> toValues
                    |> Expect.equal
                        { threshold1 = 6
                        , threshold2 = 7
                        , threshold3 = 8
                        , threshold4 = 9
                        , threshold5 = 10
                        }
        , test "updateMaximum adjusts other thresholds if they are bigger than the new value" <|
            \_ ->
                thresholds
                    |> updateMaximum 4
                    |> toValues
                    |> Expect.equal
                        { threshold1 = 0
                        , threshold2 = 1
                        , threshold3 = 2
                        , threshold4 = 3
                        , threshold5 = 4
                        }
        , test "fitThresholds sets the thresholds evenly between bounds" <|
            \_ ->
                let
                    bounds =
                        Just { min = 0.0, max = 40.0 }
                in
                thresholds
                    |> fitThresholds bounds
                    |> toValues
                    |> Expect.equal
                        { threshold1 = 0
                        , threshold2 = 10
                        , threshold3 = 20
                        , threshold4 = 30
                        , threshold5 = 40
                        }
        , test "fitThresholds sets the thresholds 1 point apart if the diff between bounds < 4" <|
            \_ ->
                let
                    bounds =
                        Just { min = 0.0, max = 3.0 }
                in
                thresholds
                    |> fitThresholds bounds
                    |> toValues
                    |> Expect.equal
                        { threshold1 = 0
                        , threshold2 = 1
                        , threshold3 = 2
                        , threshold4 = 3
                        , threshold5 = 4
                        }
        , test "fitThresholds sets the upper threshold always bigger than max bound and bottom threshold always smaller than min bound" <|
            \_ ->
                let
                    bounds =
                        Just { min = 0.9, max = 40.1 }
                in
                thresholds
                    |> fitThresholds bounds
                    |> toValues
                    |> Expect.equal
                        { threshold1 = 0
                        , threshold2 = 10
                        , threshold3 = 20
                        , threshold4 = 30
                        , threshold5 = 41
                        }
        ]

module Data.HeatMapThresholds exposing
    ( HeatMapThresholdValues
    , HeatMapThresholds
    , Range(..)
    , Threshold
    , extremes
    , fetch
    , fetchDefaults
    , fitThresholds
    , rangeFor
    , rangeIntFor
    , toDefaults
    , toValues
    , updateFromValues
    , updateMaximum
    , updateMinimum
    )

import Http
import Json.Decode as Decode exposing (Decoder)
import RemoteData exposing (RemoteData(..), WebData)
import Sensor exposing (Sensor)
import Url


type alias Threshold =
    { default : Int
    , value : Int
    }


type alias HeatMapThresholds =
    { threshold1 : Threshold
    , threshold2 : Threshold
    , threshold3 : Threshold
    , threshold4 : Threshold
    , threshold5 : Threshold
    }


type alias HeatMapThresholdValues =
    { threshold1 : Int
    , threshold2 : Int
    , threshold3 : Int
    , threshold4 : Int
    , threshold5 : Int
    }


type Range
    = Range1
    | Range2
    | Range3
    | Range4
    | Default


updateThresholdValue : Int -> Threshold -> Threshold
updateThresholdValue value threshold =
    { threshold | value = value }


resetThresholdValueToDefault : Threshold -> Threshold
resetThresholdValueToDefault threshold =
    { threshold | value = threshold.default }


toValues : HeatMapThresholds -> HeatMapThresholdValues
toValues { threshold1, threshold2, threshold3, threshold4, threshold5 } =
    { threshold1 = threshold1.value
    , threshold2 = threshold2.value
    , threshold3 = threshold3.value
    , threshold4 = threshold4.value
    , threshold5 = threshold5.value
    }


rangeFor : Int -> HeatMapThresholds -> Range
rangeFor i thresholds =
    if i < thresholds.threshold1.value then
        Default

    else if i <= thresholds.threshold2.value then
        Range1

    else if i <= thresholds.threshold3.value then
        Range2

    else if i <= thresholds.threshold4.value then
        Range3

    else if i <= thresholds.threshold5.value then
        Range4

    else
        Default


rangeIntFor : Maybe Int -> WebData HeatMapThresholds -> Int
rangeIntFor maybeValue webDataThresholds =
    case ( maybeValue, webDataThresholds ) of
        ( Just value, Success thresholds ) ->
            if value < thresholds.threshold1.value then
                0

            else if value <= thresholds.threshold2.value then
                1

            else if value <= thresholds.threshold3.value then
                2

            else if value <= thresholds.threshold4.value then
                3

            else if value <= thresholds.threshold5.value then
                4

            else
                0

        _ ->
            0


toDefaults : HeatMapThresholds -> HeatMapThresholds
toDefaults heatMapThresholds =
    { threshold1 = resetThresholdValueToDefault heatMapThresholds.threshold1
    , threshold2 = resetThresholdValueToDefault heatMapThresholds.threshold2
    , threshold3 = resetThresholdValueToDefault heatMapThresholds.threshold3
    , threshold4 = resetThresholdValueToDefault heatMapThresholds.threshold4
    , threshold5 = resetThresholdValueToDefault heatMapThresholds.threshold5
    }


fitThresholds : Maybe { min : Float, max : Float } -> HeatMapThresholds -> HeatMapThresholds
fitThresholds maybeBounds heatMapThresholds =
    case maybeBounds of
        Just bounds ->
            let
                min =
                    floor bounds.min

                max =
                    ceiling bounds.max

                step =
                    (max - min) // 4 |> biggest 1

                threshold2 =
                    min + step

                threshold3 =
                    threshold2 + step

                threshold4 =
                    threshold3 + step

                threshold5 =
                    threshold4 + step |> biggest max
            in
            updateFromValues
                { threshold1 = min
                , threshold2 = threshold2
                , threshold3 = threshold3
                , threshold4 = threshold4
                , threshold5 = threshold5
                }
                heatMapThresholds

        Nothing ->
            heatMapThresholds


biggest : Int -> Int -> Int
biggest x y =
    if x > y then
        x

    else
        y


extremes : HeatMapThresholds -> ( Int, Int )
extremes { threshold1, threshold5 } =
    ( threshold1.value, threshold5.value )


updateMinimum : Int -> HeatMapThresholds -> HeatMapThresholds
updateMinimum value heatMapThresholds =
    if value + 4 > heatMapThresholds.threshold5.value then
        { threshold1 = updateThresholdValue value heatMapThresholds.threshold1
        , threshold2 = updateThresholdValue (value + 1) heatMapThresholds.threshold2
        , threshold3 = updateThresholdValue (value + 2) heatMapThresholds.threshold3
        , threshold4 = updateThresholdValue (value + 3) heatMapThresholds.threshold4
        , threshold5 = updateThresholdValue (value + 4) heatMapThresholds.threshold5
        }

    else
        { heatMapThresholds | threshold1 = updateThresholdValue value heatMapThresholds.threshold1 }


updateMaximum : Int -> HeatMapThresholds -> HeatMapThresholds
updateMaximum value heatMapThresholds =
    if heatMapThresholds.threshold1.value > value - 4 then
        { threshold1 = updateThresholdValue (value - 4) heatMapThresholds.threshold1
        , threshold2 = updateThresholdValue (value - 3) heatMapThresholds.threshold2
        , threshold3 = updateThresholdValue (value - 2) heatMapThresholds.threshold3
        , threshold4 = updateThresholdValue (value - 1) heatMapThresholds.threshold4
        , threshold5 = updateThresholdValue value heatMapThresholds.threshold5
        }

    else
        { heatMapThresholds | threshold5 = updateThresholdValue value heatMapThresholds.threshold5 }


updateFromValues : HeatMapThresholdValues -> HeatMapThresholds -> HeatMapThresholds
updateFromValues values heatMapThresholds =
    { heatMapThresholds
        | threshold1 = updateThresholdValue values.threshold1 heatMapThresholds.threshold1
        , threshold2 = updateThresholdValue values.threshold2 heatMapThresholds.threshold2
        , threshold3 = updateThresholdValue values.threshold3 heatMapThresholds.threshold3
        , threshold4 = updateThresholdValue values.threshold4 heatMapThresholds.threshold4
        , threshold5 = updateThresholdValue values.threshold5 heatMapThresholds.threshold5
    }


fetch : List Sensor -> String -> (Result Http.Error HeatMapThresholds -> msg) -> Maybe (Cmd msg)
fetch sensors sensorId toCmd =
    fetch_ (decoder toHeatMapThresholds) sensors sensorId toCmd


fetch_ : Decoder HeatMapThresholds -> List Sensor -> String -> (Result Http.Error HeatMapThresholds -> msg) -> Maybe (Cmd msg)
fetch_ decoder_ sensors sensorId toCmd =
    let
        maybeSensorName =
            Sensor.nameForSensorId sensorId sensors

        maybeUnit =
            Sensor.unitForSensorId sensorId sensors

        http_request sensorName unit =
            Http.get
                { url = "/api/thresholds/" ++ sensorName ++ "?unit_symbol=" ++ Url.percentEncode unit
                , expect = Http.expectJson toCmd decoder_
                }
    in
    Maybe.map2 http_request maybeSensorName maybeUnit


fetchDefaults : List Sensor -> String -> (Result Http.Error HeatMapThresholds -> msg) -> HeatMapThresholdValues -> Maybe (Cmd msg)
fetchDefaults sensors sensorId toCmd heatMapThresholdValues =
    fetch_ (decoder (toHeatMapThresholdsWithDefaults heatMapThresholdValues)) sensors sensorId toCmd


maybeIntDecoder : Maybe Int -> Decoder Int
maybeIntDecoder m =
    case m of
        Nothing ->
            Decode.fail "threshold must be an Int"

        Just i ->
            Decode.succeed i


intAsStringDecoder : Decoder Int
intAsStringDecoder =
    Decode.string
        |> Decode.map String.toInt
        |> Decode.andThen maybeIntDecoder


decoder : (Int -> Int -> Int -> Int -> Int -> HeatMapThresholds) -> Decoder HeatMapThresholds
decoder yellow =
    Decode.map5 yellow
        (Decode.index 0 intAsStringDecoder)
        (Decode.index 1 intAsStringDecoder)
        (Decode.index 2 intAsStringDecoder)
        (Decode.index 3 intAsStringDecoder)
        (Decode.index 4 intAsStringDecoder)


toHeatMapThresholds : Int -> Int -> Int -> Int -> Int -> HeatMapThresholds
toHeatMapThresholds t1 t2 t3 t4 t5 =
    HeatMapThresholds
        { value = t1, default = t1 }
        { value = t2, default = t2 }
        { value = t3, default = t3 }
        { value = t4, default = t4 }
        { value = t5, default = t5 }


toHeatMapThresholdsWithDefaults : HeatMapThresholdValues -> Int -> Int -> Int -> Int -> Int -> HeatMapThresholds
toHeatMapThresholdsWithDefaults values t1 t2 t3 t4 t5 =
    HeatMapThresholds
        { value = values.threshold1, default = t1 }
        { value = values.threshold2, default = t2 }
        { value = values.threshold3, default = t3 }
        { value = values.threshold4, default = t4 }
        { value = values.threshold5, default = t5 }

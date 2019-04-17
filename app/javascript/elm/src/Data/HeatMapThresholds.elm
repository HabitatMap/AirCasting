module Data.HeatMapThresholds exposing (HeatMapThresholdValues, HeatMapThresholds, Threshold, extremes, fetch, resetToDefaults, toValues, updateFromValues, updateMaximum, updateMinimum)

import Http
import Json.Decode as Decode exposing (Decoder(..))
import Sensor exposing (Sensor)
import Url


type alias Threshold =
    { default : Int, value : Int }


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


resetToDefaults : HeatMapThresholds -> HeatMapThresholds
resetToDefaults heatMapThresholds =
    { threshold1 = resetThresholdValueToDefault heatMapThresholds.threshold1
    , threshold2 = resetThresholdValueToDefault heatMapThresholds.threshold2
    , threshold3 = resetThresholdValueToDefault heatMapThresholds.threshold3
    , threshold4 = resetThresholdValueToDefault heatMapThresholds.threshold4
    , threshold5 = resetThresholdValueToDefault heatMapThresholds.threshold5
    }


extremes : HeatMapThresholds -> ( Int, Int )
extremes { threshold1, threshold5 } =
    ( threshold1.value, threshold5.value )


updateMinimum : Int -> HeatMapThresholds -> HeatMapThresholds
updateMinimum value heatMapThresholds =
    { heatMapThresholds | threshold1 = updateThresholdValue value heatMapThresholds.threshold1 }


updateMaximum : Int -> HeatMapThresholds -> HeatMapThresholds
updateMaximum value heatMapThresholds =
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
    let
        maybeSensorName =
            Sensor.nameForSensorId sensorId sensors

        maybeUnit =
            Sensor.unitForSensorId sensorId sensors

        fetch_ sensorName unit =
            Http.get
                { url = "/api/thresholds/" ++ sensorName ++ "?unit_symbol=" ++ Url.percentEncode unit
                , expect = Http.expectJson toCmd decoder
                }
    in
    Maybe.map2 fetch_ maybeSensorName maybeUnit


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


decoder : Decoder HeatMapThresholds
decoder =
    Decode.map5 toHeatMapThresholds
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

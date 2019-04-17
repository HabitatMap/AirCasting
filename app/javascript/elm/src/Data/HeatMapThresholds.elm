module Data.HeatMapThresholds exposing (HeatMapThresholds, extremes, fetch, updateMaximum, updateMinimum)

import Http
import Json.Decode as Decode exposing (Decoder(..))
import Sensor exposing (Sensor)
import Url


type alias HeatMapThresholds =
    { threshold1 : Int
    , threshold2 : Int
    , threshold3 : Int
    , threshold4 : Int
    , threshold5 : Int
    }


extremes : HeatMapThresholds -> ( Int, Int )
extremes heatMapThresholds =
    ( heatMapThresholds.threshold1, heatMapThresholds.threshold5 )


updateMinimum : Int -> HeatMapThresholds -> HeatMapThresholds
updateMinimum threshold1 heatMapThresholds =
    { heatMapThresholds | threshold1 = threshold1 }


updateMaximum : Int -> HeatMapThresholds -> HeatMapThresholds
updateMaximum threshold5 heatMapThresholds =
    { heatMapThresholds | threshold5 = threshold5 }


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
    Decode.map5 HeatMapThresholds
        (Decode.index 0 intAsStringDecoder)
        (Decode.index 1 intAsStringDecoder)
        (Decode.index 2 intAsStringDecoder)
        (Decode.index 3 intAsStringDecoder)
        (Decode.index 4 intAsStringDecoder)

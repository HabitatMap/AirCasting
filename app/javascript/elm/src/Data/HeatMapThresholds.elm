module Data.HeatMapThresholds exposing (HeatMapThresholds, fetch)

import Http
import Json.Decode as Decode exposing (Decoder(..))
import Sensor exposing (Sensor)


type alias HeatMapThresholds =
    { h1 : Int
    , h2 : Int
    , h3 : Int
    , h4 : Int
    , h5 : Int
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
                { url = "/api/thresholds/" ++ sensorName ++ "?unit_symbol=" ++ unit
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

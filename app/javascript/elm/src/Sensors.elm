module Sensors exposing (ParameterSensorPair, allSensorsLabelsForParameter, decodeParameterSensorPair, idFor)

import Json.Decode as Decode
import Json.Encode as Encode


type alias ParameterSensorPair =
    { id_ : String
    , sensor : String
    , parameter : String
    , unit : String
    , label : String
    }


decodeParameterSensorPair : Encode.Value -> List ParameterSensorPair
decodeParameterSensorPair sensors =
    let
        result =
            Decode.decodeValue (Decode.list sensorsDecoder) sensors
    in
    case result of
        Ok values ->
            values
                |> List.map
                    (\pair ->
                        { id_ = pair.parameter ++ "-" ++ String.toLower pair.sensor ++ " (" ++ pair.unit ++ ")"
                        , sensor = pair.sensor
                        , parameter = String.toLower pair.parameter
                        , unit = pair.unit
                        , label = pair.sensor ++ " (" ++ pair.unit ++ ")"
                        }
                    )

        Err error ->
            []


sensorsDecoder =
    Decode.map3 Yellow
        (Decode.field "sensor_name" Decode.string)
        (Decode.field "measurement_type" Decode.string)
        (Decode.field "unit_symbol" Decode.string)


type alias Yellow =
    { sensor : String
    , parameter : String
    , unit : String
    }


allSensorsLabelsForParameter : List ParameterSensorPair -> String -> List String
allSensorsLabelsForParameter parameterSensorPairs parameter =
    parameterSensorPairs
        |> List.filter (\pair -> pair.parameter == parameter)
        |> List.map (\pair -> pair.label)
        |> List.sort


idFor : String -> String -> List ParameterSensorPair -> String
idFor parameter label pairs =
    let
        maybePair =
            pairs
                |> List.filter (\pair -> pair.parameter == parameter && pair.label == label)
                |> List.head
    in
    case maybePair of
        Just pair ->
            pair.id_

        Nothing ->
            ""

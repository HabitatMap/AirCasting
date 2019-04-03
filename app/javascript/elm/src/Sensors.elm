module Sensors exposing (ParameterSensorPairs, allSensorsForParameter, decodeParameterSensorPairs, idFor)

import Json.Decode as Decode



-- decodeParameterSensorPairs : Encode.Value ->


decodeParameterSensorPairs sensors =
    let
        result =
            Decode.decodeValue (Decode.list sensorsDecoder) sensors
    in
    case result of
        Ok values ->
            List.map (\pair -> { pair | parameter = String.toLower pair.parameter }) values

        Err _ ->
            []


sensorsDecoder =
    Decode.map5 ParameterSensorPairs
        (Decode.field "id" Decode.string)
        (Decode.field "sensor_name" Decode.string)
        (Decode.field "measurement_type" Decode.string)
        (Decode.field "unit_symbol" Decode.string)
        (Decode.field "label" Decode.string)


type alias ParameterSensorPairs =
    { id_ : String
    , sensor : String
    , parameter : String
    , unit : String
    , label : String
    }


allSensorsForParameter parameterSensorPairs parameter =
    List.filter (\pair -> pair.parameter == parameter) parameterSensorPairs
        |> List.map (\pair -> pair.label)


type alias Sensors =
    { prioritized : Maybe (List String)
    , other : Maybe (List String)
    }


idFor parameter sensor =
    "Sound Level-phone microphone (dB)"

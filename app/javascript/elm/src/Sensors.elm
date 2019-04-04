module Sensors exposing (ParameterSensorPair, allParametersWithPrioritization, decodeParameterSensorPairs, idForParameterOrLabel, labelForId, labelsForParameterInId, parameterForId)

import Json.Decode as Decode
import Json.Encode as Encode
import Set


type alias ParameterSensorPair =
    { id_ : String
    , sensor : String
    , parameter : String
    , unit : String
    , label : String
    , session_count : Int
    }


decodeParameterSensorPairs : Encode.Value -> List ParameterSensorPair
decodeParameterSensorPairs sensors =
    let
        result =
            Decode.decodeValue (Decode.list sensorsDecoder) sensors
    in
    case result of
        Ok values ->
            values
                |> List.map
                    (\pair ->
                        { id_ = String.toLower pair.parameter ++ "-" ++ String.toLower pair.sensor ++ " (" ++ pair.unit ++ ")"
                        , sensor = pair.sensor
                        , parameter = String.toLower pair.parameter
                        , unit = pair.unit
                        , label = pair.sensor ++ " (" ++ pair.unit ++ ")"
                        , session_count = pair.session_count
                        }
                    )

        Err error ->
            []


sensorsDecoder =
    Decode.map4 Decodable
        (Decode.field "sensor_name" Decode.string)
        (Decode.field "measurement_type" Decode.string)
        (Decode.field "unit_symbol" Decode.string)
        (Decode.field "session_count" Decode.int)


type alias Decodable =
    { sensor : String
    , parameter : String
    , unit : String
    , session_count : Int
    }


labelsForParameterInId : List ParameterSensorPair -> String -> List String
labelsForParameterInId pairs sensorId =
    pairs
        |> List.filter (\pair -> pair.parameter == parameterForId pairs sensorId)
        |> List.map (\pair -> pair.label)
        |> List.sort


labelForId : List ParameterSensorPair -> String -> String
labelForId pairs sensorId =
    let
        maybePair =
            pairs
                |> List.filter (\pair -> pair.id_ == sensorId)
                |> List.head
    in
    case maybePair of
        Just pair ->
            pair.label

        Nothing ->
            ""


parameterForId : List ParameterSensorPair -> String -> String
parameterForId pairs sensorId =
    let
        maybePair =
            pairs
                |> List.filter (\pair -> pair.id_ == sensorId)
                |> List.head
    in
    case maybePair of
        Just pair ->
            pair.parameter

        Nothing ->
            ""


allParameters : List ParameterSensorPair -> List String
allParameters pairs =
    List.map (\pair -> pair.parameter) pairs
        |> Set.fromList
        |> Set.toList


allParametersWithPrioritization : List ParameterSensorPair -> { main : List String, other : Maybe (List String) }
allParametersWithPrioritization pairs =
    let
        prioritizeParameters =
            [ "particulate matter", "humidity", "temperature", "sound level" ]

        otherParameters =
            allParameters pairs
                |> List.filter (\pair -> not (List.member pair prioritizeParameters))
                |> List.sort

        maybeOtherParameters =
            if List.isEmpty otherParameters then
                Nothing

            else
                Just otherParameters
    in
    { main = prioritizeParameters
    , other = maybeOtherParameters
    }


idForParameterOrLabel : String -> String -> List ParameterSensorPair -> String
idForParameterOrLabel key oldSensorId pairs =
    let
        maybeParameterPair =
            pairs
                |> List.filter (\pair -> pair.parameter == key)
                |> List.sortBy .session_count
                |> List.reverse
                |> List.head
    in
    case maybeParameterPair of
        Just pair ->
            pair.id_

        Nothing ->
            let
                maybeSensorPair =
                    pairs
                        |> List.filter (\pair -> pair.label == key)
                        |> List.head
            in
            case maybeSensorPair of
                Just pair ->
                    pair.id_

                Nothing ->
                    "particulate matter-airbeam2-pm2.5 (µg/m³)"

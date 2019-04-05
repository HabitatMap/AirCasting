module Sensor exposing (Sensor, allParametersWithPrioritization, decodeSensors, idForParameterOrLabel, parameterForId, sensorLabelForId, sensorLabelsForParameterInId)

import Json.Decode as Decode
import Json.Encode as Encode
import Set


type alias Sensor =
    { id_ : String
    , sensor : String
    , parameter : String
    , unit : String
    , label : String
    , session_count : Int
    }


decodeSensors : Encode.Value -> List Sensor
decodeSensors sensors =
    let
        sensorsDecoder =
            Decode.map4 toSensor
                (Decode.field "sensor_name" Decode.string)
                (Decode.field "measurement_type" Decode.string)
                (Decode.field "unit_symbol" Decode.string)
                (Decode.field "session_count" Decode.int)
    in
    sensors
        |> Decode.decodeValue (Decode.list sensorsDecoder)
        |> Result.withDefault []


toSensor sensor parameter unit session_count =
    { id_ = String.toLower parameter ++ "-" ++ String.toLower sensor ++ " (" ++ unit ++ ")"
    , sensor = sensor
    , parameter = String.toLower parameter
    , unit = unit
    , label = sensor ++ " (" ++ unit ++ ")"
    , session_count = session_count
    }


sensorLabelsForParameterInId : List Sensor -> String -> List String
sensorLabelsForParameterInId sensors sensorId =
    sensors
        |> List.filter (\sensor -> sensor.parameter == parameterForId sensors sensorId)
        |> List.map .label
        |> List.sort


sensorLabelForId : List Sensor -> String -> String
sensorLabelForId sensors sensorId =
    sensors
        |> List.filter (\sensor -> sensor.id_ == sensorId)
        |> List.head
        |> Maybe.map .label
        |> Maybe.withDefault ""


parameterForId : List Sensor -> String -> String
parameterForId sensors sensorId =
    sensors
        |> List.filter (\sensor -> sensor.id_ == sensorId)
        |> List.head
        |> Maybe.map .parameter
        |> Maybe.withDefault ""


allParameters : List Sensor -> List String
allParameters sensors =
    sensors
        |> List.map .parameter
        |> Set.fromList
        |> Set.toList


allParametersWithPrioritization : List Sensor -> { main : List String, others : Maybe (List String) }
allParametersWithPrioritization sensors =
    let
        prioritizeParameters =
            [ "particulate matter", "humidity", "temperature", "sound level" ]

        othersParameters =
            allParameters sensors
                |> List.filter (\sensor -> not (List.member sensor prioritizeParameters))
                |> List.sort

        maybeOtherParameters =
            if List.isEmpty othersParameters then
                Nothing

            else
                Just othersParameters
    in
    { main = prioritizeParameters
    , others = maybeOtherParameters
    }


idForParameterOrLabel : String -> String -> List Sensor -> String
idForParameterOrLabel key oldSensorId sensors =
    sensors
        |> List.filter (\sensor -> sensor.parameter == key)
        |> List.sortBy .session_count
        |> List.reverse
        |> List.head
        |> Maybe.map .id_
        |> Maybe.withDefault
            (sensors
                |> List.filter (\sensor -> sensor.label == key && sensor.parameter == parameterForId sensors oldSensorId)
                |> List.head
                |> Maybe.map .id_
                |> Maybe.withDefault
                    "particulate matter-airbeam2-pm2.5 (µg/m³)"
            )

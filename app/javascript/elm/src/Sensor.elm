module Sensor exposing (Sensor, allParametersWithPrioritization, decodeSensors, idForParameterOrLabel, isParametedPrioritized, parameterForId, sensorLabelForId, sensorLabelsForParameterInId, sensorsLabelsForIdWithPrioritization)

import Dict
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


toSensor : String -> String -> String -> Int -> Sensor
toSensor sensor parameter unit session_count =
    { id_ = parameter ++ "-" ++ String.toLower sensor ++ " (" ++ unit ++ ")"
    , sensor = sensor
    , parameter = parameter
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


allParametersWithPrioritization : List Sensor -> { main : List String, others : List String }
allParametersWithPrioritization sensors =
    let
        othersParameters =
            allParameters sensors
                |> List.filter (\sensor -> not (List.member sensor (Dict.keys mainSensors)))
                |> List.sort
    in
    { main = Dict.keys mainSensors
    , others = othersParameters
    }


sensorsLabelsForIdWithPrioritization : List Sensor -> String -> { main : List String, others : List String }
sensorsLabelsForIdWithPrioritization sensors sensorId =
    let
        allLabels =
            sensors
                |> List.filter (\sensor -> sensor.parameter == parameterForId sensors sensorId)
                |> List.map .label
                |> List.sort

        mainLabels =
            mainSensors
                |> Dict.get (parameterForId sensors sensorId)
                |> Maybe.withDefault []

        othersLabels =
            List.filter (\label -> not (List.member label mainLabels)) allLabels
    in
    { main = mainLabels
    , others = othersLabels
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
                    "Particulate Matter-airbeam2-pm2.5 (µg/m³)"
            )


isParametedPrioritized : List Sensor -> String -> Bool
isParametedPrioritized sensors sensorId =
    List.member (parameterForId sensors sensorId) (Dict.keys mainSensors)


mainSensors : Dict.Dict String (List String)
mainSensors =
    Dict.fromList
        [ ( "Particulate Matter"
          , [ "AirBeam2-PM2.5 (µg/m³)"
            , "AirBeam2-PM1 (µg/m³)"
            , "AirBeam2-PM10 (µg/m³)"
            , "AirBeam-PM (µg/m³)"
            ]
          )
        , ( "Humidity", [ "AirBeam2-RH (%)", "AirBeam-RH (%)" ] )
        , ( "Temperature", [ "AirBeam2-F (F)", "AirBeam-F (F)" ] )
        , ( "Sound Level", [ "Phone Microphone (dB)" ] )
        ]

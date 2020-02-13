module Sensor exposing
    ( Sensor
    , decoder
    , idForParameterOrLabel
    , labelsForParameter
    , nameForSensorId
    , parameterForId
    , parameters
    , sensorLabelForId
    , toId
    , unitForSensorId
    )

import Dict
import Json.Decode as Decode exposing (Decoder(..))
import NaturalOrdering
import Set


defaultSensorId : String
defaultSensorId =
    "Particulate Matter-airbeam2-pm2.5 (µg/m³)"


defaultSensorIdByParameter : Dict.Dict String String
defaultSensorIdByParameter =
    Dict.fromList
        [ ( "Particulate Matter", defaultSensorId )
        , ( "Humidity", "Humidity-airbeam2-rh (%)" )
        , ( "Sound Level", "Sound Level-phone microphone (dB)" )
        , ( "Temperature", "Temperature-airbeam2-f (F)" )
        ]


mainSensors : Dict.Dict String (List String)
mainSensors =
    Dict.fromList
        [ ( "Particulate Matter"
          , [ "AirBeam2-PM2.5 (µg/m³)"
            , "AirBeam2-PM1 (µg/m³)"
            , "AirBeam2-PM10 (µg/m³)"
            , "AirBeam-PM (µg/m³)"
            , "OpenAQ-PM2.5 (µg/m³)"
            ]
          )
        , ( "Humidity", [ "AirBeam2-RH (%)", "AirBeam-RH (%)" ] )
        , ( "Temperature", [ "AirBeam2-F (F)", "AirBeam-F (F)" ] )
        , ( "Sound Level", [ "Phone Microphone (dB)" ] )
        ]


type alias Sensor =
    { name : String
    , parameter : String
    , unit : String
    , sessionCount : Int
    }


decoder : Decoder Sensor
decoder =
    Decode.map4 Sensor
        (Decode.field "sensor_name" Decode.string)
        (Decode.field "measurement_type" Decode.string)
        (Decode.field "unit_symbol" Decode.string)
        (Decode.field "session_count" Decode.int)


toId : Sensor -> String
toId sensor =
    sensor.parameter ++ "-" ++ String.toLower sensor.name ++ " (" ++ sensor.unit ++ ")"


toLabel : Sensor -> String
toLabel sensor =
    sensor.name ++ " (" ++ sensor.unit ++ ")"


sensorLabelForId : List Sensor -> String -> String
sensorLabelForId sensors sensorId =
    sensors
        |> List.filter (\sensor -> toId sensor == sensorId)
        |> List.head
        |> Maybe.map toLabel
        |> Maybe.withDefault ""


parameterForId : List Sensor -> String -> String
parameterForId sensors sensorId =
    sensors
        |> List.filter (\sensor -> toId sensor == sensorId)
        |> List.head
        |> Maybe.map .parameter
        |> Maybe.withDefault ""


parameters : List Sensor -> ( List String, List String )
parameters sensors =
    let
        othersParameters =
            sensors
                |> List.map (String.trim << .parameter)
                |> Set.fromList
                |> Set.toList
                |> List.filter (\sensor -> not (List.member sensor (Dict.keys mainSensors)))
                |> List.sortWith NaturalOrdering.compare
    in
    ( Dict.keys mainSensors, othersParameters )


labelsForParameter : List Sensor -> String -> ( List String, List String )
labelsForParameter sensors sensorId =
    let
        allLabels =
            sensors
                |> List.filter (\sensor -> sensor.parameter == parameterForId sensors sensorId)
                |> List.map toLabel
                |> List.sortWith NaturalOrdering.compare

        mainLabels_ =
            let
                allLabelsWithSessions =
                    sensors |> List.filter (\s -> s.sessionCount > 0) |> List.map toLabel

                labelHasSessions label =
                    List.member label allLabelsWithSessions
            in
            mainSensors
                |> Dict.get (parameterForId sensors sensorId)
                |> Maybe.withDefault []
                |> List.filter labelHasSessions

        othersLabels_ =
            List.filter (\label -> not (List.member label mainLabels_)) allLabels
    in
    ( mainLabels_, othersLabels_ )


idForParameterOrLabel : String -> String -> List Sensor -> String
idForParameterOrLabel parameterOrLabel oldSensorId sensors =
    let
        byId id =
            sensors
                |> List.filter (\sensor -> toId sensor == id)
                |> List.head
                |> Maybe.map toId

        maybeDefault =
            Dict.get parameterOrLabel defaultSensorIdByParameter
                |> Maybe.andThen byId

        maybeByParameter =
            sensors
                |> List.filter (\sensor -> sensor.parameter == parameterOrLabel)
                |> List.sortBy .sessionCount
                |> List.reverse
                |> List.head
                |> Maybe.map toId

        maybeByLabel =
            sensors
                |> List.filter (\sensor -> toLabel sensor == parameterOrLabel && sensor.parameter == parameterForId sensors oldSensorId)
                |> List.head
                |> Maybe.map toId
    in
    case ( maybeDefault, maybeByParameter, maybeByLabel ) of
        ( Just default, _, _ ) ->
            default

        ( _, Just byParameter, _ ) ->
            byParameter

        ( _, _, Just byLabel ) ->
            byLabel

        _ ->
            defaultSensorId


nameForSensorId : String -> List Sensor -> Maybe String
nameForSensorId id sensors =
    sensors
        |> List.filter (\sensor -> toId sensor == id)
        |> List.head
        |> Maybe.map .name


unitForSensorId : String -> List Sensor -> Maybe String
unitForSensorId id sensors =
    sensors
        |> List.filter (\sensor -> toId sensor == id)
        |> List.head
        |> Maybe.map .unit

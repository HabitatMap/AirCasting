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

import Data.Page exposing (Page(..))
import Dict
import Json.Decode as Decode exposing (Decoder)
import NaturalOrdering
import Set


mobileDefaultSensorId : String
mobileDefaultSensorId =
    "Particulate Matter-airbeam-pm2.5 (µg/m³)"


fixedDefaultSensorId : String
fixedDefaultSensorId =
    "Particulate Matter-airbeam-pm2.5 (µg/m³)"


defaultSensorIdByParameter : Page -> Dict.Dict String String
defaultSensorIdByParameter page =
    let
        common =
            Dict.fromList
                [ ( "Humidity", "Humidity-airbeam-rh (%)" )
                , ( "Sound Level", "Sound Level-phone microphone (dB)" )
                , ( "Temperature", "Temperature-airbeam-f (F)" )
                ]
    in
    case page of
        Mobile ->
            common
                |> Dict.insert "Particulate Matter" mobileDefaultSensorId

        Fixed ->
            common
                |> Dict.insert "Particulate Matter" fixedDefaultSensorId


mainSensors : Page -> Dict.Dict String (List String)
mainSensors page =
    let
        common =
            Dict.fromList
                [ ( "Particulate Matter"
                  , [ "AirBeam-PM10 (µg/m³)"
                    , "AirBeam-PM2.5 (µg/m³)"
                    , "AirBeam-PM1 (µg/m³)"
                    , "Government-PM2.5"
                    ]
                  )
                , ( "Humidity"
                  , [ "AirBeam-RH (%)"
                    ]
                  )
                , ( "Temperature"
                  , [ "AirBeam-F (F)"
                    ]
                  )
                ]
    in
    case page of
        Mobile ->
            common
                |> Dict.insert "Sound Level" [ "Phone Microphone (dB)" ]

        Fixed ->
            common


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


parameters : Page -> List Sensor -> ( List String, List String )
parameters page sensors =
    let
        othersParameters =
            sensors
                |> List.map (String.trim << .parameter)
                |> Set.fromList
                |> Set.toList
                |> List.filter (\sensor -> not (List.member sensor (Dict.keys <| mainSensors page)))
                |> List.sortWith NaturalOrdering.compare
    in
    ( Dict.keys <| mainSensors page, othersParameters )


labelsForParameter : Page -> List Sensor -> String -> ( List String, List String )
labelsForParameter page sensors sensorId =
    let
        allLabels =
            sensors
                |> List.filter (\sensor -> sensor.parameter == parameterForId sensors sensorId)
                |> List.map toLabel
                |> List.sortWith NaturalOrdering.compare

        mainLabels_ =
            mainSensors page
                |> Dict.get (parameterForId sensors sensorId)
                |> Maybe.withDefault []

        othersLabels_ =
            List.filter (\label -> not (List.member label mainLabels_)) allLabels
    in
    ( mainLabels_, othersLabels_ )


idForParameterOrLabel : Page -> String -> String -> List Sensor -> String
idForParameterOrLabel page parameterOrLabel oldSensorId sensors =
    let
        byId id =
            sensors
                |> List.filter (\sensor -> toId sensor == id)
                |> List.head
                |> Maybe.map toId

        maybeDefault =
            defaultSensorIdByParameter page
                |> Dict.get parameterOrLabel
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
            case page of
                Mobile ->
                    mobileDefaultSensorId

                Fixed ->
                    fixedDefaultSensorId


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

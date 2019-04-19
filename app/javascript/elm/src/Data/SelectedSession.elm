module Data.SelectedSession exposing (SelectedSession, decoder, fetch, view)

import Data.HeatMapThresholds as HeatMapThresholds exposing (HeatMapThresholds)
import Data.Page exposing (Page(..))
import Data.Session
import Data.Times as Times
import Html exposing (Html, div, p, span, text)
import Html.Attributes exposing (class)
import Http
import Json.Decode as Decode exposing (Decoder(..))
import RemoteData exposing (WebData)
import Sensor exposing (Sensor)
import Time exposing (Posix)


type alias SelectedSession =
    { title : String
    , username : String
    , sensorName : String
    , average : Float
    , min : Float
    , max : Float
    , startTime : Posix
    , endTime : Posix
    , measurements : List Float
    , id : Int
    }


decoder : Decoder SelectedSession
decoder =
    Decode.map8 toSelectedSession
        (Decode.field "title" Decode.string)
        (Decode.field "username" Decode.string)
        (Decode.field "sensor_name" Decode.string)
        (Decode.field "average" (Decode.nullable Decode.float) |> Decode.map (Maybe.withDefault -1))
        (Decode.field "startTime" Decode.int |> Decode.map Time.millisToPosix)
        (Decode.field "endTime" Decode.int |> Decode.map Time.millisToPosix)
        (Decode.field "measurements" (Decode.list Decode.float))
        (Decode.field "id" Decode.int)


toSelectedSession : String -> String -> String -> Float -> Posix -> Posix -> List Float -> Int -> SelectedSession
toSelectedSession title username sensorName average startTime endTime measurements sessionId =
    { title = title
    , username = username
    , sensorName = sensorName
    , average = average
    , min = List.minimum measurements |> Maybe.withDefault -1
    , max = List.maximum measurements |> Maybe.withDefault -1
    , startTime = startTime
    , endTime = endTime
    , measurements = measurements
    , id = sessionId
    }


fetch : List Sensor -> String -> Page -> Int -> (Result Http.Error SelectedSession -> msg) -> Cmd msg
fetch sensors sensorId page id toCmd =
    let
        maybeSensorName =
            Sensor.nameForSensorId sensorId sensors
    in
    case maybeSensorName of
        Just sensorName ->
            Http.get
                { url =
                    if page == Mobile then
                        "/api/mobile/sessions/" ++ String.fromInt id ++ ".json?sensor_name=" ++ sensorName

                    else
                        "/api/fixed/sessions/" ++ String.fromInt id ++ ".json?sensor_name=" ++ sensorName
                , expect = Http.expectJson toCmd decoder
                }

        Nothing ->
            Cmd.none


view : SelectedSession -> WebData HeatMapThresholds -> Html msg
view session heatMapThresholds =
    let
        ( start, end ) =
            Times.format session.startTime session.endTime
    in
    div []
        [ p [ class "single-session-name" ] [ text session.title ]
        , p [ class "single-session-username" ] [ text session.username ]
        , p [ class "single-session-sensor" ] [ text session.sensorName ]
        , div []
            [ div [ class "single-session-avg-color", class <| Data.Session.classByValue (Just session.average) heatMapThresholds ] []
            , span [ class "single-session-info" ] [ text "avg. " ]
            , span [ class "single-session-avg" ] [ text <| String.fromInt <| round session.average ]
            ]
        , div [ class "session-numbers-container" ]
            [ div [ class "single-min-max-container" ]
                [ div [ class "single-session-color", class <| Data.Session.classByValue (Just session.min) heatMapThresholds ] []
                , span [ class "single-session-info" ] [ text "min. " ]
                , span [ class "single-session-min" ] [ text <| String.fromFloat session.min ]
                ]
            , div [ class "single-min-max-container" ]
                [ div [ class "single-session-color", class <| Data.Session.classByValue (Just session.max) heatMapThresholds ] []
                , span [ class "single-session-info" ] [ text "max. " ]
                , span [ class "single-session-max" ] [ text <| String.fromFloat session.max ]
                ]
            ]
        , span [ class "single-session-start" ] [ text start, text " " ]
        , span [ class "single-session-end" ] [ text end ]
        ]

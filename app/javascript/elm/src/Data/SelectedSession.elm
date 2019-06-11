module Data.SelectedSession exposing
    ( SelectedSession
    , decoder
    , fetch
    , times
    , toId
    , toStreamIds
    , updateRange
    , view
    )

import Api
import Data.HeatMapThresholds as HeatMapThresholds exposing (HeatMapThresholds)
import Data.Page exposing (Page(..))
import Data.Path as Path exposing (Path)
import Data.Session
import Data.Times as Times
import Html exposing (Html, a, button, div, img, p, span, text)
import Html.Attributes exposing (alt, class, href, id, src, target)
import Html.Events as Events
import Http
import Json.Decode as Decode exposing (Decoder(..))
import Json.Decode.Pipeline exposing (custom, hardcoded, required)
import RemoteData exposing (RemoteData(..), WebData)
import Sensor exposing (Sensor)
import Time exposing (Posix)


type alias SelectedSession =
    { title : String
    , username : String
    , sensorName : String
    , startTime : Posix
    , endTime : Posix
    , id : Int
    , streamIds : List Int
    , selectedMeasurements : List Float
    }


times : SelectedSession -> { start : Int, end : Int }
times { startTime, endTime } =
    { start = Time.posixToMillis startTime, end = Time.posixToMillis endTime }


toStreamIds : SelectedSession -> List Int
toStreamIds { streamIds } =
    streamIds


toId : SelectedSession -> Int
toId { id } =
    id


millisToPosixDecoder : Decoder Posix
millisToPosixDecoder =
    Decode.int
        |> Decode.map Time.millisToPosix


decoder : Decoder SelectedSession
decoder =
    Decode.succeed toSelectedSession
        |> required "title" Decode.string
        |> required "username" Decode.string
        |> required "sensorName" Decode.string
        |> required "startTime" millisToPosixDecoder
        |> required "endTime" millisToPosixDecoder
        |> required "id" Decode.int
        |> required "streamIds" (Decode.list Decode.int)
        |> hardcoded []


toSelectedSession : String -> String -> String -> Posix -> Posix -> Int -> List Int -> List Float -> SelectedSession
toSelectedSession title username sensorName startTime endTime sessionId streamIds selectedMeasurements =
    { title = title
    , username = username
    , sensorName = sensorName
    , startTime = startTime
    , endTime = endTime
    , id = sessionId
    , streamIds = streamIds
    , selectedMeasurements = selectedMeasurements
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


updateRange : WebData SelectedSession -> List Float -> WebData SelectedSession
updateRange result measurements =
    case result of
        Success session ->
            Success { session | selectedMeasurements = measurements }

        _ ->
            result


view : SelectedSession -> WebData HeatMapThresholds -> Path -> (String -> msg) -> Html msg
view session heatMapThresholds linkIcon toMsg =
    let
        tooltipId =
            "graph-copy-link-tooltip"
    in
    div []
        [ p [ class "single-session-name" ] [ text session.title ]
        , p [ class "single-session-username" ] [ text session.username ]
        , p [ class "single-session-sensor" ] [ text session.sensorName ]
        , case session.selectedMeasurements of
            [] ->
                div [ class "single-session-placeholder" ] []

            measurements ->
                let
                    min =
                        List.minimum measurements |> Maybe.withDefault -1

                    max =
                        List.maximum measurements |> Maybe.withDefault -1

                    average =
                        List.sum measurements / toFloat (List.length measurements)
                in
                div []
                    [ div []
                        [ div [ class "single-session-avg-color", class <| Data.Session.classByValue (Just average) heatMapThresholds ] []
                        , span [] [ text "avg. " ]
                        , span [ class "single-session-avg" ] [ text <| String.fromInt <| round average ]
                        , span [] [ text " µg/m³" ]
                        ]
                    , div [ class "session-numbers-container" ]
                        [ div [ class "single-min-max-container" ]
                            [ div [ class "single-session-color", class <| Data.Session.classByValue (Just min) heatMapThresholds ] []
                            , span [] [ text "min. " ]
                            , span [ class "single-session-min" ] [ text <| String.fromFloat min ]
                            ]
                        , div [ class "single-min-max-container" ]
                            [ div [ class "single-session-color", class <| Data.Session.classByValue (Just max) heatMapThresholds ] []
                            , span [] [ text "max. " ]
                            , span [ class "single-session-max" ] [ text <| String.fromFloat max ]
                            ]
                        ]
                    ]
        , span [ class "single-session-date" ] [ text <| Times.format session.startTime session.endTime ]
        , div [ class "action-buttons " ]
            [ a [ class "button button--primary action-button action-button--export", target "_blank", href <| Api.exportLink [ session ] ] [ text "export session" ]
            , button [ class "button button--primary action-button action-button--copy-link", Events.onClick <| toMsg tooltipId, id tooltipId ] [ img [ src (Path.toString linkIcon), alt "Link icon" ] [] ]
            ]
        ]

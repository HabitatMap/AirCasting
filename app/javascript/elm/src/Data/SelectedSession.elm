module Data.SelectedSession exposing
    ( SelectedSession
    , decoder
    , fetch
    , times
    , toId
    , toStreamId
    , view
    )

import Api
import Data.HeatMapThresholds as HeatMapThresholds exposing (HeatMapThresholds)
import Data.Page exposing (Page(..))
import Data.Session
import Data.Times as Times
import Html exposing (Html, a, button, div, img, p, span, text)
import Html.Attributes exposing (alt, class, href, id, src, target)
import Html.Events as Events
import Http
import Json.Decode as Decode exposing (Decoder(..))
import Json.Decode.Pipeline exposing (custom, required)
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
    , streamId : Int
    }


times : SelectedSession -> { start : Int, end : Int }
times { startTime, endTime } =
    { start = Time.posixToMillis startTime, end = Time.posixToMillis endTime }


toStreamId : SelectedSession -> Int
toStreamId { streamId } =
    streamId


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
        |> required "average" Decode.float
        |> required "startTime" millisToPosixDecoder
        |> required "endTime" millisToPosixDecoder
        |> required "measurements" (Decode.list Decode.float)
        |> required "id" Decode.int
        |> required "streamId" Decode.int


toSelectedSession : String -> String -> String -> Float -> Posix -> Posix -> List Float -> Int -> Int -> SelectedSession
toSelectedSession title username sensorName average startTime endTime measurements sessionId streamId =
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
    , streamId = streamId
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


view : SelectedSession -> WebData HeatMapThresholds -> String -> (String -> msg) -> Html msg
view session heatMapThresholds linkIcon toMsg =
    let
        tooltipId =
            "graph-copy-link-tooltip"
    in
    div []
        [ p [ class "single-session-name" ] [ text session.title ]
        , p [ class "single-session-username" ] [ text session.username ]
        , p [ class "single-session-sensor" ] [ text session.sensorName ]
        , div []
            [ div [ class "single-session-avg-color", class <| Data.Session.classByValue (Just session.average) heatMapThresholds ] []
            , span [] [ text "avg. " ]
            , span [ class "single-session-avg" ] [ text <| String.fromInt <| round session.average ]
            ]
        , div [ class "session-numbers-container" ]
            [ div [ class "single-min-max-container" ]
                [ div [ class "single-session-color", class <| Data.Session.classByValue (Just session.min) heatMapThresholds ] []
                , span [] [ text "min. " ]
                , span [ class "single-session-min" ] [ text <| String.fromFloat session.min ]
                ]
            , div [ class "single-min-max-container" ]
                [ div [ class "single-session-color", class <| Data.Session.classByValue (Just session.max) heatMapThresholds ] []
                , span [] [ text "max. " ]
                , span [ class "single-session-max" ] [ text <| String.fromFloat session.max ]
                ]
            ]
        , span [ class "single-session-date" ] [ text <| Times.format session.startTime session.endTime ]
        , div [ class "action-buttons " ]
            [ button [ class "button button--primary action-button action-button--export", target "_blank", href <| Api.exportLink [ session ] ] [ text "export session" ]
            , button [ class "button button--primary action-button action-button--copy-link", Events.onClick <| toMsg tooltipId, id tooltipId ] [ img [ src linkIcon, alt "Link icon" ] [] ]
            ]
        ]

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
import Data.HeatMapThresholds exposing (HeatMapThresholds)
import Data.Page exposing (Page(..))
import Data.Path as Path exposing (Path)
import Data.Session
import Data.Times as Times
import Html exposing (Html, a, button, div, img, p, span, text)
import Html.Attributes exposing (alt, class, href, id, src, target)
import Html.Events as Events
import Http
import Json.Decode as Decode exposing (Decoder(..))
import Json.Decode.Pipeline exposing (hardcoded, required)
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
    , sensorUnit : String
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
    Decode.succeed SelectedSession
        |> required "title" Decode.string
        |> required "username" Decode.string
        |> required "sensorName" Decode.string
        |> required "startTime" millisToPosixDecoder
        |> required "endTime" millisToPosixDecoder
        |> required "id" Decode.int
        |> required "streamIds" (Decode.list Decode.int)
        |> hardcoded []
        |> required "sensorUnit" Decode.string


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
    div [ class "single-session__info" ]
        [ div []
            [ p [ class "single-session__name" ] [ text session.title ]
            , p [ class "single-session__username" ] [ text session.username ]
            , p [ class "single-session__sensor" ] [ text session.sensorName ]
            , case session.selectedMeasurements of
                [] ->
                    div [ class "single-session__placeholder" ] []

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
                            [ div [ class "single-session__avg-color", class <| Data.Session.classByValue (Just average) heatMapThresholds ] []
                            , span [] [ text "avg. " ]
                            , span [ class "single-session__avg" ] [ text <| String.fromInt <| round average ]
                            , span [] [ text <| " " ++ session.sensorUnit ]
                            ]
                        , div [ class "session-numbers-container" ]
                            [ div [ class "session-min-max-container" ]
                                [ div [ class "single-session__color", class <| Data.Session.classByValue (Just min) heatMapThresholds ] []
                                , span [] [ text "min. " ]
                                , span [ class "single-session__min" ] [ text <| String.fromFloat min ]
                                ]
                            , div [ class "session-min-max-container" ]
                                [ div [ class "single-session__color", class <| Data.Session.classByValue (Just max) heatMapThresholds ] []
                                , span [] [ text "max. " ]
                                , span [ class "single-session__max" ] [ text <| String.fromFloat max ]
                                ]
                            ]
                        ]
            , span [ class "single-session__date" ] [ text <| Times.format session.startTime session.endTime ]
            ]
        , div [ class "action-buttons" ]
            [ a [ class "button button--primary action-button action-button--export", target "_blank", href <| Api.exportLink [ session ] ] [ text "export session" ]
            , button [ class "button button--primary action-button action-button--copy-link", Events.onClick <| toMsg tooltipId, id tooltipId ] [ img [ src (Path.toString linkIcon), alt "Link icon" ] [] ]
            ]
        ]

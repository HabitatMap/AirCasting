module Data.SelectedSession exposing (SelectedSession, decoder, fetch, sensorNameFromId, view)

import Data.Page exposing (Page(..))
import Html exposing (Html, div, p, span, text)
import Html.Attributes exposing (class)
import Http
import Json.Decode as Decode exposing (Decoder(..))
import RemoteData exposing (RemoteData(..), WebData)


type alias SelectedSession =
    { title : String
    , username : String
    , sensorName : String
    , average : Float
    , min : Float
    , max : Float
    , startTime : String
    , endTime : String
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
        (Decode.field "endTime" Decode.string)
        (Decode.field "startTime" Decode.string)
        (Decode.field "measurements" (Decode.list Decode.float))
        (Decode.field "id" Decode.int)


toSelectedSession : String -> String -> String -> Float -> String -> String -> List Float -> Int -> SelectedSession
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


sensorNameFromId : String -> String
sensorNameFromId =
    String.split "-" >> List.drop 1 >> String.join "-" >> String.split " " >> List.head >> Maybe.withDefault ""


fetch : String -> Page -> Int -> (WebData SelectedSession -> msg) -> Cmd msg
fetch sensorId page id toMsg =
    Http.get
        { url =
            if page == Mobile then
                "/api/mobile/sessions/" ++ String.fromInt id ++ ".json?sensor_name=" ++ sensorNameFromId sensorId

            else
                "/api/fixed/sessions/" ++ String.fromInt id ++ ".json?sensor_name=" ++ sensorNameFromId sensorId
        , expect = Http.expectJson (RemoteData.fromResult >> toMsg) decoder
        }


view : SelectedSession -> Html msg
view session =
    div []
        [ p [ class "single-session-name" ] [ text session.title ]
        , p [ class "single-session-username" ] [ text session.username ]
        , p [ class "single-session-sensor" ] [ text session.sensorName ]
        , div []
            [ div [ class "single-session-avg-color green-bg" ] []
            , span [ class "single-session-info" ] [ text "avg. " ]
            , span [ class "single-session-avg" ] [ text <| String.fromFloat session.average ]
            ]
        , div [ class "session-numbers-container" ]
            [ div [ class "single-min-max-container" ]
                [ div [ class "single-session-color green-bg" ] []
                , span [ class "single-session-info" ] [ text "min. " ]
                , span [ class "single-session-min" ] [ text <| String.fromFloat session.min ]
                ]
            , div [ class "single-min-max-container" ]
                [ div [ class "single-session-color green-bg" ] []
                , span [ class "single-session-info" ] [ text "max. " ]
                , span [ class "single-session-max" ] [ text <| String.fromFloat session.max ]
                ]
            ]
        , span [ class "single-session-start" ] [ text session.startTime, text " " ]
        , span [ class "single-session-end" ] [ text session.endTime ]
        ]

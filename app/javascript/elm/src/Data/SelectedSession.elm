module Data.SelectedSession exposing (SelectedSession, decoder, fetch, sensorNameFromId, view)

import Data.Page exposing (Page(..))
import Html exposing (Html, div, p, text)
import Html.Attributes as Attr
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
        [ p [ Attr.class "single-session-TODO" ] [ text session.title ]
        , p [ Attr.class "single-session-TODO" ] [ text session.username ]
        , p [ Attr.class "single-session-TODO" ] [ text session.sensorName ]
        , p [ Attr.class "single-session-TODO" ] [ text <| String.fromFloat session.min ]
        , p [ Attr.class "single-session-TODO" ] [ text <| String.fromFloat session.max ]
        , p [ Attr.class "single-session-TODO" ] [ text <| String.fromInt <| round session.average ]
        , p [ Attr.class "single-session-TODO" ] [ text session.startTime ]
        , p [ Attr.class "single-session-TODO" ] [ text session.endTime ]
        ]

module Data.Session exposing (Location, Session, ShortType, classByValue, decoder)

import Data.HeatMapThresholds as HeatMapThresholds exposing (HeatMapThresholds, Range(..))
import Json.Decode as Decode exposing (Decoder)
import Json.Decode.Pipeline exposing (required)
import Maybe exposing (Maybe)
import RemoteData exposing (RemoteData(..), WebData)
import Time exposing (Posix)


type alias ShortType =
    { name : String
    , type_ : String
    }


type alias Location =
    { lat : Float
    , lng : Float
    }


type alias Session =
    { title : String
    , id : Int
    , startTime : Posix
    , endTime : Posix
    , username : String
    , shortTypes : List ShortType
    , average : Maybe Float
    , location : Location
    , streamId : Int
    }


decoder : Decoder Session
decoder =
    Decode.succeed Session
        |> required "title" Decode.string
        |> required "id" Decode.int
        |> required "startTime" (Decode.int |> Decode.map Time.millisToPosix)
        |> required "endTime" (Decode.int |> Decode.map Time.millisToPosix)
        |> required "username" Decode.string
        |> required "shortTypes" (Decode.list shortTypeDecoder)
        |> required "average" (Decode.nullable Decode.float)
        |> required "location" locationDecoder
        |> required "streamId" Decode.int


shortTypeDecoder : Decoder ShortType
shortTypeDecoder =
    Decode.map2 ShortType
        (Decode.field "name" Decode.string)
        (Decode.field "type_" Decode.string)


locationDecoder : Decoder Location
locationDecoder =
    Decode.map2 Location
        (Decode.field "lat" Decode.float)
        (Decode.field "lng" Decode.float)


classByValue : Maybe Float -> WebData HeatMapThresholds -> String
classByValue average heatMapThresholds =
    case ( average, heatMapThresholds ) of
        ( Just avg, Success thresholds ) ->
            case HeatMapThresholds.rangeFor (round avg) thresholds of
                Range1 ->
                    "level1-bg"

                Range2 ->
                    "level2-bg"

                Range3 ->
                    "level3-bg"

                Range4 ->
                    "level4-bg"

                Default ->
                    "grey-bg"

        _ ->
            "grey-bg"

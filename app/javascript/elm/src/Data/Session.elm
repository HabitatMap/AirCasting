module Data.Session exposing (Session, ShortType, classByValue, decoder)

import Data.HeatMapThresholds as HeatMapThresholds exposing (HeatMapThresholds, Range(..))
import Json.Decode as Decode exposing (Decoder(..))
import Maybe exposing (Maybe)
import RemoteData exposing (RemoteData(..), WebData)
import Time exposing (Posix)


type alias ShortType =
    { name : String
    , type_ : String
    }


type alias Session =
    { title : String
    , id : Int
    , startTime : Posix
    , endTime : Posix
    , username : String
    , shortTypes : List ShortType
    , average : Maybe Float
    }


decoder : Decoder Session
decoder =
    Decode.map7 Session
        (Decode.field "title" Decode.string)
        (Decode.field "id" Decode.int)
        (Decode.field "startTime" Decode.int |> Decode.map Time.millisToPosix)
        (Decode.field "endTime" Decode.int |> Decode.map Time.millisToPosix)
        (Decode.field "username" Decode.string)
        (Decode.field "shortTypes" <| Decode.list shortTypeDecoder)
        (Decode.field "average" <| Decode.nullable Decode.float)


shortTypeDecoder : Decoder ShortType
shortTypeDecoder =
    Decode.map2 ShortType
        (Decode.field "name" Decode.string)
        (Decode.field "type_" Decode.string)


classByValue : Maybe Float -> WebData HeatMapThresholds -> String
classByValue average heatMapThresholds =
    case ( average, heatMapThresholds ) of
        ( Just avg, Success thresholds ) ->
            case HeatMapThresholds.rangeFor (round avg) thresholds of
                Range1 ->
                    "grey-bg"

                Range2 ->
                    "green-bg"

                Range3 ->
                    "yellow-bg"

                Range4 ->
                    "orange-bg"

                Range5 ->
                    "red-bg"

                Range6 ->
                    "grey-bg"

        ( _, _ ) ->
            "grey-bg"

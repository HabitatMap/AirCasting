module Data.Session exposing (Session, ShortType, classByValue)

import Data.HeatMapThresholds as HeatMapThresholds exposing (HeatMapThresholds, Range(..))
import Maybe exposing (Maybe)
import RemoteData exposing (RemoteData(..), WebData)


type alias ShortType =
    { name : String
    , type_ : String
    }


type alias Session =
    { title : String
    , id : Int
    , startTime : String
    , endTime : String
    , username : String
    , shortTypes : List ShortType
    , average : Maybe Float
    }


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

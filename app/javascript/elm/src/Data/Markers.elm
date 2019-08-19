module Data.Markers exposing (SessionMarkerData, toSessionMarkerData)

import Data.HeatMapThresholds exposing (HeatMapThresholds, rangeIntFor)
import Data.Session exposing (Location)
import RemoteData exposing (WebData)


type alias SessionMarkerData =
    { id : Int
    , location : Location
    , heatLevel : Int
    }


toSessionMarkerData : Location -> Int -> Maybe Float -> WebData HeatMapThresholds -> SessionMarkerData
toSessionMarkerData location id maybeAverage heatMapThresholds =
    { location = location
    , id = id
    , heatLevel = rangeIntFor (Maybe.map round maybeAverage) heatMapThresholds
    }

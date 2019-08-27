module Data.GraphData exposing (GraphData, GraphHeatData, GraphTimeRange)

import Data.Measurements exposing (Measurement)


type alias GraphData =
    { sensor :
        { parameter : String
        , unit : String
        }
    , heat : GraphHeatData
    , times :
        { start : Int
        , end : Int
        }
    , measurements : List Measurement
    }


type alias GraphHeatData =
    { threshold1 : Int
    , threshold5 : Int
    , levels :
        List
            { from : Int
            , to : Int
            , className : String
            }
    }


type alias GraphTimeRange =
    { start : Float
    , end : Float
    }

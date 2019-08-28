module Data.GraphData exposing (GraphData, GraphHeatData, GraphMeasurementsData, GraphTimeRange)

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


type alias GraphMeasurementsData =
    { measurements : List Measurement
    , times :
        { start : Int
        , end : Int
        }
    }


type alias GraphTimeRange =
    { start : Float
    , end : Float
    }

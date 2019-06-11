module Data.GraphData exposing (GraphData)


type alias GraphData =
    { sensor :
        { parameter : String
        , unit : String
        }
    , heat :
        { threshold1 : Int
        , threshold5 : Int
        , levels :
            List
                { from : Int
                , to : Int
                , className : String
                }
        }
    , times :
        { start : Int
        , end : Int
        }
    , streamIds : List Int
    }

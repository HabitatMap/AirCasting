module Data.Measurements exposing (Measurement)


type alias Measurement =
    { value : Float
    , time : Int
    , latitude : Float
    , longitude : Float
    }

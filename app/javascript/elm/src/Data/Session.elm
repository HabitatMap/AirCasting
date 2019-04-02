module Data.Session exposing (Session, ShortType)


type alias ShortType =
    { name : String
    , type_ : String
    }


type alias Session =
    { title : String
    , id : Int
    , timeframe : String
    , username : String
    , shortTypes : List ShortType
    , selected : Bool -- THIS IS USED IN JS, IN ELM WE TRACK SELECTION IN selectedSessionId. REMOVE WHEN MOVING FETCHING FROM JS TO ELM
    }

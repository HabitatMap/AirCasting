module Data.Session exposing (Session, ShortType)


type alias ShortType =
    { name : String
    , type_ : String
    }


type alias Session =
    { title : String
    , id : Int
    , timeRange : String
    , username : String
    , shortTypes : List ShortType
    }

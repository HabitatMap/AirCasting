module Data.Page exposing (Page(..), toString)


type Page
    = Fixed
    | Mobile


toString : Page -> String
toString page =
    case page of
        Fixed ->
            "Fixed"

        Mobile ->
            "Mobile"

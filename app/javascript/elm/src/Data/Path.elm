module Data.Path exposing (Path, empty, fromString, toString)


type Path
    = Path String


empty : Path
empty =
    Path ""


fromString : String -> Path
fromString path =
    Path path


toString : Path -> String
toString (Path path) =
    path

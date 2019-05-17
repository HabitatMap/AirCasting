module Data.Path exposing (Path, fromString, toString)


type Path
    = Path String


fromString : String -> Path
fromString path =
    Path path


toString : Path -> String
toString (Path path) =
    path

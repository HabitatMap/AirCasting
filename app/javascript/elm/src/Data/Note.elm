module Data.Note exposing (Note, decoder)

import Json.Decode as Decode
import Json.Decode.Pipeline exposing (optional, required)


type alias Note =
    { text : String
    , longitude : Float
    , latitude : Float
    , date : String
    , photo : Maybe String
    , photo_thumbnail : Maybe String
    }


decoder =
    Decode.succeed Note
        |> required "text" Decode.string
        |> required "longitude" Decode.float
        |> required "latitude" Decode.float
        |> required "date" Decode.string
        |> optional "photo" (Decode.map Just Decode.string) Nothing
        |> optional "photo_thumbnail" (Decode.map Just Decode.string) Nothing

module Data.Measurements exposing (Measurement, decoder, fetch)

import Http
import Json.Decode as Decode
import Json.Decode.Pipeline exposing (required)
import Url.Builder


type alias Measurement =
    { value : Float
    , time : Int
    , latitude : Float
    , longitude : Float
    }


decoder =
    Decode.succeed Measurement
        |> required "value" Decode.float
        |> required "time" Decode.int
        |> required "latitude" Decode.float
        |> required "longitude" Decode.float


fetch : Int -> (Result Http.Error (List Measurement) -> msg) -> Float -> Float -> Cmd msg
fetch streamId toCmd startTime endTime =
    Http.get
        { url =
            Url.Builder.absolute
                [ "api", "measurements" ]
                [ Url.Builder.string "stream_ids" (String.fromInt streamId)
                , Url.Builder.string "start_time" (String.fromFloat startTime)
                , Url.Builder.string "end_time" (String.fromFloat endTime)
                ]
        , expect = Http.expectJson toCmd (Decode.list decoder)
        }

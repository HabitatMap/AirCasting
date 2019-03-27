module TimeRange exposing (TimeRange(..), defaultTimeRange, update, view)

import Html exposing (Html, div, h4, input, label, text)
import Html.Attributes as Attr
import Json.Decode as Decode
import Json.Encode as Encode


type TimeRange
    = TimeRange Range


type alias Range =
    { timeFrom : Int
    , timeTo : Int
    }


defaultTimeRange : TimeRange
defaultTimeRange =
    TimeRange
        { timeFrom = 1
        , timeTo = 1
        }


update : TimeRange -> Encode.Value -> TimeRange
update timeRange newValue =
    let
        result =
            Decode.decodeValue timeRangeDecoder newValue
    in
    case result of
        Ok decodedValue ->
            TimeRange
                { timeFrom = decodedValue.timeFrom
                , timeTo = decodedValue.timeTo
                }

        Err _ ->
            timeRange


timeRangeDecoder : Decode.Decoder Range
timeRangeDecoder =
    Decode.map2 Range
        (Decode.field "timeFrom" Decode.int)
        (Decode.field "timeTo" Decode.int)


view : Html msg
view =
    div []
        [ label [ Attr.for "time-range" ] [ text "time range:" ]

        , input
            [ Attr.id "time-range"
            , Attr.attribute "autocomplete" "off"
            , Attr.class "input-dark"
            , Attr.class "input-filters"
            , Attr.placeholder "time range"
            , Attr.type_ "text"
            , Attr.name "time-range"
            ]
            []
        ]

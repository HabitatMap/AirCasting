module TimeRange exposing (TimeRange(..), defaultTimeRange, update, viewTimeFilter)

import Html exposing (Html, button, div, h4, input, text)
import Html.Attributes as Attr
import Html.Events as Events
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


timeRangeDecoder =
    Decode.map2 Range
        (Decode.field "timeFrom" Decode.int)
        (Decode.field "timeTo" Decode.int)


viewTimeFilter : msg -> Html msg
viewTimeFilter refreshTimeRange =
    div
        [ Attr.id "test-time-filter" ]
        [ h4 [] [ text "Time Range" ]
        , input
            [ Attr.id "daterange"
            , Attr.class "filters-input"
            , Attr.attribute "autocomplete" "off"
            ]
            []
        , button [ Events.onClick refreshTimeRange ] []
        ]

module TimeRange exposing (TimeRange(..), defaultTimeRange, update, view)

import Html exposing (Html, button, div, h4, img, input, label, text)
import Html.Attributes exposing (attribute, class, disabled, for, id, name, placeholder, src, type_)
import Html.Events as Events
import Json.Decode as Decode
import Json.Encode as Encode
import Tooltip


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


view : msg -> Bool -> String -> Html msg
view refreshTimeRange isDisabled tooltipIcon =
    div [ class "filters__input-group" ]
        [ input
            [ id "time-range"
            , attribute "autocomplete" "off"
            , class "input-dark"
            , class "input-filters"
            , class "input-time"
            , placeholder "time frame"
            , type_ "text"
            , name "time-range"
            , disabled isDisabled
            ]
            []
        , label [ for "time-range" ] [ text "time frame:" ]
        , Tooltip.view Tooltip.timeRangeFilter tooltipIcon
        , button [ Events.onClick refreshTimeRange ] [ text "refresh" ]
        ]

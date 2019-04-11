module TimeRange exposing (TimeRange(..), defaultTimeRange, update, view)

import Html exposing (Html, button, div, h4, input, label, text)
import Html.Attributes exposing (attribute, class, disabled, for, id, name, placeholder, type_)
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


timeRangeDecoder : Decode.Decoder Range
timeRangeDecoder =
    Decode.map2 Range
        (Decode.field "timeFrom" Decode.int)
        (Decode.field "timeTo" Decode.int)


view : msg -> Bool -> Html msg
view refreshTimeRange isDisabled =
    div []
        [ label [ for "time-range" ] [ text "time range:" ]
        , input
            [ id "time-range"
            , attribute "autocomplete" "off"
            , class "input-dark"
            , class "input-filters"
            , class "input-time"
            , placeholder "time range"
            , type_ "text"
            , name "time-range"
            , disabled isDisabled
            ]
            []
        , button [ Events.onClick refreshTimeRange ] [ text "refresh" ]
        ]

module TimeRange exposing (TimeRange(..), defaultTimeRange, update, view)

import Data.Path as Path exposing (Path)
import Html exposing (Html, button, div, img, input, label, text)
import Html.Attributes exposing (alt, attribute, class, for, id, name, src)
import Html.Attributes.Aria exposing (ariaLabel)
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


view : msg -> Path -> Html msg
view refreshTimeRange resetIcon =
    div [ class "filters__input-group" ]
        [ input
            [ id "time-range"
            , attribute "autocomplete" "off"
            , class "input input--dark input--filters input--time js--time-range"
            , name "time-range"
            ]
            []
        , button
            [ id "time-range-button"
            , attribute "autocomplete" "off"
            , class "input input--dark input--filters input--time button--input js--time-range-button"
            , name "time-range-button"
            ]
            []
        , label
            [ class "label label--filters u--hide-on-mobile"
            , for "time-range"
            ]
            [ text "time frame:" ]
        , label
            [ class "label label--filters u--show-on-mobile"
            ]
            [ text "time frame:" ]
        , Tooltip.view Tooltip.timeRangeFilter
        , button
            [ ariaLabel "Reset time frame"
            , class "refresh-timerange-button"
            , Events.onClick refreshTimeRange
            ]
            [ img
                [ src (Path.toString resetIcon)
                , alt "Reset icon"
                ]
                []
            ]
        ]

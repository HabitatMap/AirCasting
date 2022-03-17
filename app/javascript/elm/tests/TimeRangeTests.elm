module TimeRangeTests exposing (all)

import Expect
import Fuzz exposing (int)
import Html.Attributes.Aria exposing (ariaLabel)
import Json.Encode as Encode
import Test exposing (..)
import Test.Html.Event as Event
import Test.Html.Query as Query
import Test.Html.Selector exposing (attribute, tag)
import TestUtils exposing (defaultIcon)
import TimeRange


type Msg
    = Msg


all : Test
all =
    describe "TimeRange"
        [ test ".view has an input field" <|
            \_ ->
                TimeRange.view (\_ -> ()) defaultIcon
                    |> Query.fromHtml
                    |> Query.has [ tag "input" ]
        , fuzz2 int int ".update returns updated TimeRange if value has correct format" <|
            \timeFrom timeTo ->
                let
                    value =
                        Encode.object [ ( "timeFrom", Encode.int timeFrom ), ( "timeTo", Encode.int timeTo ) ]

                    expected =
                        TimeRange.TimeRange
                            { timeFrom = timeFrom
                            , timeTo = timeTo
                            }
                in
                TimeRange.update TimeRange.defaultTimeRange value
                    |> Expect.equal expected
        , test ".update returns the same TimeRange if value has incorrect format" <|
            \_ ->
                let
                    value =
                        Encode.object [ ( "otherField", Encode.int 1 ) ]

                    expected =
                        TimeRange.defaultTimeRange
                in
                TimeRange.update TimeRange.defaultTimeRange value
                    |> Expect.equal expected
        , test "viewTimeFilter has a reset time frame button" <|
            \_ ->
                TimeRange.view Msg defaultIcon
                    |> Query.fromHtml
                    |> Query.find [ attribute <| ariaLabel "Reset time frame" ]
                    |> Event.simulate Event.click
                    |> Event.expect Msg
        ]

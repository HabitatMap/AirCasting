module FixedSessionsFiltersTests exposing (timeFilter)

import Expect
import FixedSessionFilters exposing (..)
import Fuzz exposing (int)
import Json.Encode as Encode
import Ports
import Test exposing (..)
import Test.Html.Query as Query
import Test.Html.Selector as Slc
import TimeRange


timeFilter : Test
timeFilter =
    describe "Time filter tests: "
        [ test "Time filter is present" <|
            \_ ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.has [ Slc.id "test-time-filter" ]
        , fuzz2 int int "UpdateTimeRange returns the updated model" <|
            \timeFrom timeTo ->
                let
                    value =
                        Encode.object [ ( "timeFrom", Encode.int timeFrom ), ( "timeTo", Encode.int timeTo ) ]

                    expected =
                        { defaultModel
                            | timeRange = TimeRange.update defaultModel.timeRange value
                        }
                in
                defaultModel
                    |> update (UpdateTimeRange value)
                    |> Tuple.first
                    |> Expect.equal expected
        ]

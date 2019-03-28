module SessionsListTests exposing (session, sessionWithId, sessionWithTitle, shortTypes, updateTests, viewTests)

import Expect
import Fuzz exposing (int, intRange, string)
import Html
import Json.Encode as Encode
import Ports
import SessionsList exposing (..)
import Test exposing (..)
import Test.Html.Query as Query
import Test.Html.Selector as Slc
import TimeRange


shortTypes : List ShortType
shortTypes =
    [ { name = "name", type_ = "type_" } ]


session : Session
session =
    { title = "title"
    , id = 1
    , timeframe = "timeframe"
    , username = "username"
    , shortTypes = shortTypes
    , selected = False
    }


sessionWithId : Int -> Session
sessionWithId id =
    { session | id = id }


sessionWithTitle : String -> Session
sessionWithTitle title =
    { session | title = title }


viewTests : Test
viewTests =
    describe "view"
        [ fuzz2 string string "session titles are displayed in the list" <|
            \title1 title2 ->
                { sessions = [ sessionWithTitle title1, sessionWithTitle title2 ], selectedSessionId = Nothing }
                    |> view
                    |> Query.fromHtml
                    |> Query.contains
                        [ Html.text title1
                        , Html.text title2
                        ]
        , fuzz int "selected session is selected in the list" <|
            \id ->
                { sessions = [ sessionWithId id, sessionWithId (id + 1) ], selectedSessionId = Just (id + 1) }
                    |> view
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.all [ Slc.tag "input", Slc.checked True ] ]
                    |> Query.count (Expect.equal 1)
        , fuzz (intRange 1 10) "with modulo 50 sessions in the model the load more button is shown" <|
            \times ->
                { sessions = List.repeat (50 * times) session, selectedSessionId = Nothing }
                    |> view
                    |> Query.fromHtml
                    |> Query.contains [ Html.text "Load More..." ]
        , test "with 0 sessions in the model the load more button is not shown" <|
            \times ->
                { sessions = [], selectedSessionId = Nothing }
                    |> view
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.text "Load More..." ]
                    |> Query.count (Expect.equal 0)
        ]


updateTests : Test
updateTests =
    describe "update"
        [ fuzz int "with no selections ToggleSessionSelection selects the session" <|
            \id ->
                let
                    model =
                        { sessions = [ sessionWithId id, sessionWithId (id + 1) ], selectedSessionId = Nothing }

                    expected =
                        { model | selectedSessionId = Just (id + 1) }
                in
                model
                    |> update (ToggleSessionSelection (id + 1))
                    |> Tuple.first
                    |> Expect.equal expected
        , fuzz int "when session was selected ToggleSessionSelection deselects it" <|
            \id ->
                let
                    model =
                        { sessions = [ sessionWithId id, sessionWithId (id + 1) ], selectedSessionId = Just (id + 1) }

                    expected =
                        { model | selectedSessionId = Nothing }
                in
                model
                    |> update (ToggleSessionSelection (id + 1))
                    |> Tuple.first
                    |> Expect.equal expected
        , fuzz int "when another session was selected ToggleSessionSelection selects the new one" <|
            \id ->
                let
                    model =
                        { sessions = [ sessionWithId id, sessionWithId (id + 1) ], selectedSessionId = Just (id + 1) }

                    expected =
                        { model | selectedSessionId = Just id }
                in
                model
                    |> update (ToggleSessionSelection id)
                    |> Tuple.first
                    |> Expect.equal expected
        , fuzz int "with no selections ToggleSessionSelection tells javascript what was selected" <|
            \id ->
                let
                    model =
                        { sessions = [ sessionWithId id, sessionWithId (id + 1) ], selectedSessionId = Nothing }

                    expected =
                        checkedSession { selected = Just (id + 1), deselected = Nothing }
                in
                model
                    |> update (ToggleSessionSelection (id + 1))
                    |> Tuple.second
                    |> Expect.equal expected
        , fuzz int "when session was selected ToggleSessionSelection tells javascript what was deselected" <|
            \id ->
                let
                    model =
                        { sessions = [ sessionWithId id, sessionWithId (id + 1) ], selectedSessionId = Just (id + 1) }

                    expected =
                        checkedSession { selected = Nothing, deselected = Just (id + 1) }
                in
                model
                    |> update (ToggleSessionSelection (id + 1))
                    |> Tuple.second
                    |> Expect.equal expected
        , fuzz int "when another session was selected ToggleSessionSelection tells javascript what was selected and what was deselected" <|
            \id ->
                let
                    model =
                        { sessions = [ sessionWithId id, sessionWithId (id + 1) ], selectedSessionId = Just (id + 1) }

                    expected =
                        checkedSession { selected = Just id, deselected = Just (id + 1) }
                in
                model
                    |> update (ToggleSessionSelection id)
                    |> Tuple.second
                    |> Expect.equal expected
        , fuzz int "UpdateSessions replaces sessions in the model" <|
            \id ->
                let
                    model =
                        { sessions = [ sessionWithId id ], selectedSessionId = Nothing }

                    newSessions =
                        [ sessionWithId (id + 1) ]
                in
                model
                    |> update (UpdateSessions newSessions)
                    |> Tuple.first
                    |> .sessions
                    |> Expect.equal newSessions
        , fuzz int "UpdateSessions selects the proper session in the model" <|
            \id ->
                let
                    model =
                        { sessions = [], selectedSessionId = Nothing }

                    selectedSession =
                        { session | id = id, selected = True }

                    unselectedSession =
                        { session | id = id + 1, selected = False }

                    newSessions =
                        [ selectedSession, unselectedSession ]
                in
                model
                    |> update (UpdateSessions newSessions)
                    |> Tuple.first
                    |> .selectedSessionId
                    |> Expect.equal (Just id)
        , fuzz int "LoadMoreSessions delegates to javascript" <|
            \id ->
                let
                    model =
                        { sessions = [], selectedSessionId = Nothing }
                in
                model
                    |> update LoadMoreSessions
                    |> Tuple.second
                    |> Expect.equal (loadMoreSessions ())
        ]

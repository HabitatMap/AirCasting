module SearchFieldWithTagsTests exposing (all)

import Expect
import Fuzz exposing (Fuzzer, bool, int, list, string)
import Html exposing (Html, div, input, label, text)
import Html.Attributes as Attr
import Json.Encode as Encode
import Ports exposing (updateTagsSearchField)
import SearchFieldWithTags exposing (..)
import Test exposing (..)
import Test.Html.Event as Event
import Test.Html.Query as Query
import Test.Html.Selector as Slc


all : Test
all =
    describe "all tests: "
        [ describe "given a search field"
            [ fuzz string "when user types, UpdateFieldContent is triggered with the input" <|
                \inputValue ->
                    initialModel
                        |> SearchFieldWithTags.view
                        |> Query.fromHtml
                        |> Query.find [ Slc.tag "input" ]
                        |> Event.simulate (Event.input inputValue)
                        |> Event.expect (UpdateFieldContent inputValue)
            , fuzz string "when UpdateFieldContent is triggered the input is displayed in the search field" <|
                \inputValue ->
                    initialModel
                        |> update (UpdateFieldContent inputValue)
                        |> Tuple.first
                        |> SearchFieldWithTags.view
                        |> Query.fromHtml
                        |> Query.find [ Slc.tag "input" ]
                        |> Query.has [ Slc.attribute <| Attr.value inputValue ]
            , fuzz string "when UpdateFieldContent is triggered the input is send to updateTagsSearchField port" <|
                \inputValue ->
                    initialModel
                        |> update (UpdateFieldContent inputValue)
                        |> Tuple.second
                        |> Expect.equal (updateTagsSearchField inputValue)
            ]
        , describe "when new activity happens "
            [ fuzz string "the search field value is reset" <|
                \activityValue ->
                    initialModel
                        |> update (GotActivity activityValue)
                        |> Tuple.first
                        |> SearchFieldWithTags.view
                        |> Query.fromHtml
                        |> Query.find [ Slc.tag "input" ]
                        |> Query.has [ Slc.attribute <| Attr.value initialModel.searchFieldContent ]
            , fuzz string "new tag is created" <|
                \activityValue ->
                    initialModel
                        |> update (GotActivity activityValue)
                        |> Tuple.first
                        |> SearchFieldWithTags.view
                        |> Query.fromHtml
                        |> Query.has [ Slc.text activityValue ]
            , test "new tag has a button" <|
                \_ ->
                    { initialModel | tags = [ "tag" ] }
                        |> SearchFieldWithTags.view
                        |> Query.fromHtml
                        |> Query.find [ Slc.containing [ Slc.text "tag" ] ]
                        |> Query.has [ Slc.tag "button" ]
            ]
        , describe "when multiple activities happen"
            [ fuzz (list string) "corresponding tags are created" <|
                \activityValues ->
                    let
                        model =
                            List.foldl
                                (\value acc ->
                                    acc
                                        |> update (GotActivity value)
                                        |> Tuple.first
                                )
                                initialModel
                                activityValues

                        tags =
                            List.map (\value -> Slc.containing [ Slc.text value ]) activityValues
                    in
                    model
                        |> SearchFieldWithTags.view
                        |> Query.fromHtml
                        |> Query.has
                            [ Slc.all tags ]
            ]
        , describe "give tags delete button"
            [ test "when user clicks it, RemoveTag is triggered with correct tag content" <|
                \_ ->
                    { initialModel | tags = [ "tag1", "tag2" ] }
                        |> SearchFieldWithTags.view
                        |> Query.fromHtml
                        |> Query.find [ Slc.id "tag1" ]
                        |> Event.simulate Event.click
                        |> Event.expect (RemoveTag "tag1")
            , test "when RemoveTag is triggered with a tag content the corresponding tag disappears" <|
                \_ ->
                    { initialModel | tags = [ "tag1", "tag2" ] }
                        |> update (RemoveTag "tag1")
                        |> Tuple.first
                        |> SearchFieldWithTags.view
                        |> Query.fromHtml
                        |> Query.hasNot [ Slc.id "tag1" ]
            , test "when RemoveTag is triggered with a tag content the other tags don't disappear" <|
                \_ ->
                    { initialModel | tags = [ "tag1", "tag2" ] }
                        |> update (RemoveTag "tag1")
                        |> Tuple.first
                        |> SearchFieldWithTags.view
                        |> Query.fromHtml
                        |> Query.has [ Slc.id "tag2" ]
            ]
        ]

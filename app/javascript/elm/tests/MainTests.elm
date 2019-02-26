module MainTests exposing (tagsArea, updateTests, viewTests)

import Expect
import Fuzz exposing (Fuzzer, bool, int, list, string)
import Html exposing (Html, div, input, label, text)
import Html.Attributes as Attr
import Json.Encode as Encode
import Main exposing (..)
import Ports
import Test exposing (..)
import Test.Html.Event as Event
import Test.Html.Query as Query
import Test.Html.Selector as Slc


tagsArea : Test
tagsArea =
    describe "Tags area tests: "
        [ describe "given a search field"
            [ fuzz string "when user types, UpdateTagsSearchFieldContent is triggered with the input" <|
                \inputValue ->
                    defaultModel
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.id "tags" ]
                        |> Query.find [ Slc.tag "input" ]
                        |> Event.simulate (Event.input inputValue)
                        |> Event.expect (UpdateTagsSearchFieldContent inputValue)
            , fuzz string "when UpdateTagsSearchFieldContent is triggered the input is displayed in the search field" <|
                \inputValue ->
                    defaultModel
                        |> update (UpdateTagsSearchFieldContent inputValue)
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.id "tags" ]
                        |> Query.find [ Slc.tag "input" ]
                        |> Query.has [ Slc.attribute <| Attr.value inputValue ]
            , fuzz string "when UpdateTagsSearchFieldContent is triggered the input is send to showAutocomplete port" <|
                \inputValue ->
                    defaultModel
                        |> update (UpdateTagsSearchFieldContent inputValue)
                        |> Tuple.second
                        |> Expect.equal (Ports.showAutocomplete inputValue)
            ]
        , describe "when new activity happens "
            [ fuzz string "the search field value is reset" <|
                \activityValue ->
                    { defaultModel | tagsSearchFieldContent = "some string" }
                        |> update (GotActivity activityValue)
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.id "tags" ]
                        |> Query.find [ Slc.tag "input" ]
                        |> Query.has [ Slc.attribute <| Attr.value "" ]
            , fuzz string "new tag is created" <|
                \activityValue ->
                    defaultModel
                        |> update (GotActivity activityValue)
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.has [ Slc.text activityValue ]
            , test "new tag has a button" <|
                \_ ->
                    { defaultModel | tags = [ "tag" ] }
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.containing [ Slc.text "tag" ] ]
                        |> Query.has [ Slc.tag "button" ]
            , fuzz string "updated tags list is sent updateTags port" <|
                \activityValue ->
                    { defaultModel | tags = [ "old tag" ] }
                        |> update (GotActivity activityValue)
                        |> Tuple.second
                        |> Expect.equal (Ports.updateTags [ activityValue, "old tag" ])
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
                                defaultModel
                                activityValues

                        tags =
                            List.map (\value -> Slc.containing [ Slc.text value ]) activityValues
                    in
                    model
                        |> view
                        |> Query.fromHtml
                        |> Query.has
                            [ Slc.all tags ]
            ]
        , describe "give tags delete button"
            [ test "when user clicks it, RemoveTag is triggered with correct tag content" <|
                \_ ->
                    { defaultModel | tags = [ "tag1", "tag2" ] }
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.id "tag1" ]
                        |> Event.simulate Event.click
                        |> Event.expect (RemoveTag "tag1")
            , test "when RemoveTag is triggered with a tag content the corresponding tag disappears" <|
                \_ ->
                    { defaultModel | tags = [ "tag1", "tag2" ] }
                        |> update (RemoveTag "tag1")
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.hasNot [ Slc.id "tag1" ]
            , test "when RemoveTag is triggered with a tag content the other tags don't disappear" <|
                \_ ->
                    { defaultModel | tags = [ "tag1", "tag2" ] }
                        |> update (RemoveTag "tag1")
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.has [ Slc.id "tag2" ]
            , fuzz2 string string "when RemoveTag is triggered updated tags list is sent updateTags port" <|
                \firstTag secondTag ->
                    { defaultModel | tags = [ firstTag, secondTag ] }
                        |> update (RemoveTag firstTag)
                        |> Tuple.second
                        |> Expect.equal (Ports.updateTags [ secondTag ])
            ]
        ]


updateTests : Test
updateTests =
    describe "update tests"
        [ fuzz bool "ToggleCrowdMap toggles the value of model.isCrowdMapOn" <|
            \onOffValue ->
                { defaultModel | isCrowdMapOn = onOffValue }
                    |> update ToggleCrowdMap
                    |> Tuple.first
                    |> .isCrowdMapOn
                    |> Expect.equal (not onOffValue)
        , fuzz int "UpdateCrowdMapResolution changes the value of model.crowdMapResolution" <|
            \resolution ->
                { defaultModel | crowdMapResolution = resolution }
                    |> update (UpdateCrowdMapResolution resolution)
                    |> Tuple.first
                    |> .crowdMapResolution
                    |> Expect.equal resolution
        ]


viewTests : Test
viewTests =
    describe "view tests"
        [ test "checkbox has a correct label" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.for "checkbox-crowd-map" ]
                    |> Query.contains
                        [ text "Crowd Map" ]
        , test "checkbox is not checked as default" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "checkbox-crowd-map" ]
                    |> Query.has
                        [ Slc.attribute <| Attr.checked False ]
        , fuzz bool "checkbox state depends on model.isCrowdMapOn" <|
            \onOffValue ->
                let
                    model =
                        { defaultModel | isCrowdMapOn = onOffValue }
                in
                model
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "checkbox-crowd-map" ]
                    |> Query.has
                        [ Slc.attribute <| Attr.checked model.isCrowdMapOn ]
        , test "clicking the checkbox sends ToggleCrowdMap message" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "checkbox-crowd-map" ]
                    |> Event.simulate Event.click
                    |> Event.expect ToggleCrowdMap
        , test "slider has a description" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "crowd-map-slider" ]
                    |> Query.contains
                        [ text "Resolution" ]
        , test "slider has a description with current crowd map resolution" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "crowd-map-slider" ]
                    |> Query.contains
                        [ text (String.fromInt defaultModel.crowdMapResolution) ]
        , test "slider default value is 25" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.class "crowd-map-slider" ]
                    |> Query.has
                        [ Slc.attribute <| Attr.value "25" ]
        , fuzz int "slider value depends on model.crowdMapResolution" <|
            \resolution ->
                let
                    model =
                        { defaultModel | crowdMapResolution = resolution }
                in
                model
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.class "crowd-map-slider" ]
                    |> Query.has
                        [ Slc.attribute <| Attr.value (String.fromInt resolution) ]
        , fuzz int "moving the slider updates crowd map resolution" <|
            \resolution ->
                let
                    target =
                        Encode.object [ ( "value", Encode.string (String.fromInt resolution) ) ]

                    simulatedEventObject =
                        Encode.object [ ( "target", target ) ]
                in
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.class "crowd-map-slider" ]
                    |> Event.simulate (Event.custom "change" simulatedEventObject)
                    |> Event.expect (UpdateCrowdMapResolution resolution)
        ]

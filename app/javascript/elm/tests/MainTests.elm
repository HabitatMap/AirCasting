module MainTests exposing (updateTests, viewTests)

import Expect
import Fuzz exposing (Fuzzer, bool, int, string)
import Html exposing (Html, input, label, text)
import Html.Attributes as Attr exposing (for)
import Json.Encode as Encode
import Main exposing (..)
import Test exposing (..)
import Test.Html.Event as Event
import Test.Html.Query as Query
import Test.Html.Selector exposing (attribute, tag)


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
                defaultModel
                    |> update (UpdateCrowdMapResolution resolution)
                    |> Tuple.first
                    |> .crowdMapResolution
                    |> Expect.equal resolution
        ]


viewTests : Test
viewTests =
    describe "view tests"
        [ test "crowd map checkbox has a correct label" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.for "checkbox-crowd-map" ]
                    |> Query.contains
                        [ text "Crowd Map" ]
        , test "crowd map checkbox is not checked as default" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.id "checkbox-crowd-map" ]
                    |> Query.has
                        [ attribute <| Attr.checked False ]
        , fuzz bool "crowd map checkbox state depends on model.isCrowdMapOn" <|
            \onOffValue ->
                let
                    model =
                        { defaultModel | isCrowdMapOn = onOffValue }
                in
                model
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.id "checkbox-crowd-map" ]
                    |> Query.has
                        [ attribute <| Attr.checked model.isCrowdMapOn ]
        , test "clicking the crowd map checkbox sends ToggleCrowdMap message" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.id "checkbox-crowd-map" ]
                    |> Event.simulate Event.click
                    |> Event.expect ToggleCrowdMap
        , test "crowd map resolution slider has a description" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.id "crowd-map-slider" ]
                    |> Query.contains
                        [ text "Resolution" ]
        , test "crowd map resolution slider has a description with current crowd map resolution" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.id "crowd-map-slider" ]
                    |> Query.contains
                        [ text (String.fromInt defaultModel.crowdMapResolution) ]
        , test "crowd map resolution slider default value is 25" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.class "crowd-map-slider" ]
                    |> Query.has
                        [ attribute <| Attr.value "25" ]
        , fuzz int "crowd map resolution slider value depends on model.crowdMapResolution" <|
            \resolution ->
                let
                    model =
                        { defaultModel | crowdMapResolution = resolution }
                in
                model
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.class "crowd-map-slider" ]
                    |> Query.has
                        [ attribute <| Attr.value (String.fromInt resolution) ]
        , fuzz int "moving the crowd map resolution slider updates crowd map resolution" <|
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
                    |> Query.find [ attribute <| Attr.class "crowd-map-slider" ]
                    |> Event.simulate (Event.custom "change" simulatedEventObject)
                    |> Event.expect (UpdateCrowdMapResolution resolution)
        , test "tags search field area is present" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.has [ attribute <| Attr.id "tags" ]

        -- , fuzz string "tags search field calls UpdateTagsSearchField on input" <|
        --     \inputValue ->
        --         defaultModel
        --             |> Main.view
        --             |> Query.fromHtml
        --             |> Query.find [ attribute <| Attr.id "tags-search" ]
        --             |> Event.simulate Event.input inputValue
        --             |> Event.expect (UpdateTagsSearchField inputValue)
        ]

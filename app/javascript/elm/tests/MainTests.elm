module MainTests exposing (updateTests, viewTests)

import Expect
import Fuzz exposing (Fuzzer, bool, int)
import Html exposing (Html, div, input, label, text)
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
                    |> Query.find [ attribute <| Attr.for "checkbox-crowd-map" ]
                    |> Query.contains
                        [ text "Crowd Map" ]
        , test "checkbox is not checked as default" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.id "checkbox-crowd-map" ]
                    |> Query.has
                        [ attribute <| Attr.checked False ]
        , fuzz bool "checkbox state depends on model.isCrowdMapOn" <|
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
        , test "clicking the checkbox sends ToggleCrowdMap message" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.id "checkbox-crowd-map" ]
                    |> Event.simulate Event.click
                    |> Event.expect ToggleCrowdMap
        , test "slider has a description" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.id "crowd-map-slider" ]
                    |> Query.contains
                        [ text "Resolution" ]
        , test "slider has a description with current crowd map resolution" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.id "crowd-map-slider" ]
                    |> Query.contains
                        [ text (String.fromInt defaultModel.crowdMapResolution) ]
        , test "slider default value is 25" <|
            \_ ->
                defaultModel
                    |> Main.view
                    |> Query.fromHtml
                    |> Query.find [ attribute <| Attr.class "crowd-map-slider" ]
                    |> Query.has
                        [ attribute <| Attr.value "25" ]
        , fuzz int "slider value depends on model.crowdMapResolution" <|
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
                    |> Query.find [ attribute <| Attr.class "crowd-map-slider" ]
                    |> Event.simulate (Event.custom "change" simulatedEventObject)
                    |> Event.expect (UpdateCrowdMapResolution resolution)
        ]

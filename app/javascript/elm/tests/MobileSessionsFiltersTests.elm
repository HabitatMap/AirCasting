module MobileSessionsFiltersTests exposing (profileNamesArea, tagsArea, timeFilter, updateTests, viewTests)

import Expect
import Fuzz exposing (bool, int, list, string)
import Html exposing (text)
import Html.Attributes as Attr
import Json.Encode as Encode
import Labels
import MobileSessionsFilters exposing (..)
import Ports
import Test exposing (..)
import Test.Html.Event as Event
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
        , fuzz2 int int "UpdateTimeRange triggers updateTimeRange port" <|
            \timeFrom timeTo ->
                let
                    value =
                        Encode.object [ ( "timeFrom", Encode.int timeFrom ), ( "timeTo", Encode.int timeTo ) ]
                in
                defaultModel
                    |> update (UpdateTimeRange value)
                    |> Tuple.second
                    |> Expect.equal (Ports.updateTimeRange value)
        ]


tagsArea : Test
tagsArea =
    describe "Tags area tests: "
        [ describe "when new activity happens "
            [ fuzz string "new tag is created" <|
                \activityValue ->
                    defaultModel
                        |> update (AddTag activityValue)
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.has [ Slc.text activityValue ]
            , test "new tag has a button" <|
                \_ ->
                    { defaultModel | tags = Labels.fromList [ "tag" ] }
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.containing [ Slc.text "tag" ] ]
                        |> Query.has [ Slc.tag "button" ]
            , test "updated tags list is sent updateTags port" <|
                \_ ->
                    { defaultModel | tags = Labels.fromList [ "oldTag" ] }
                        |> update (AddTag "newTag")
                        |> Tuple.second
                        |> Expect.equal (Ports.updateTags [ "newTag", "oldTag" ])
            ]
        , describe "when multiple activities happen"
            [ fuzz (list string) "corresponding tags are created" <|
                \activityValues ->
                    let
                        model =
                            List.foldl
                                (\value acc ->
                                    acc
                                        |> update (AddTag value)
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
                    { defaultModel | tags = Labels.fromList [ "tag1", "tag2" ] }
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.id "tag1" ]
                        |> Event.simulate Event.click
                        |> Event.expect (RemoveTag "tag1")
            , test "when RemoveTag is triggered with a tag content the corresponding tag disappears" <|
                \_ ->
                    { defaultModel | tags = Labels.fromList [ "tag1", "tag2" ] }
                        |> update (RemoveTag "tag1")
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.hasNot [ Slc.id "tag1" ]
            , test "when RemoveTag is triggered with a tag content the other tags don't disappear" <|
                \_ ->
                    { defaultModel | tags = Labels.fromList [ "tag1", "tag2" ] }
                        |> update (RemoveTag "tag1")
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.has [ Slc.id "tag2" ]
            , test "when RemoveTag is triggered updated tags list is sent updateTags port" <|
                \_ ->
                    { defaultModel | tags = Labels.fromList [ "firstTag", "secondTag" ] }
                        |> update (RemoveTag "firstTag")
                        |> Tuple.second
                        |> Expect.equal (Ports.updateTags [ "secondTag" ])
            ]
        ]


profileNamesArea : Test
profileNamesArea =
    describe "Profile names tests: "
        [ describe "when AddProfile is triggered"
            [ fuzz string "new profile label is created" <|
                \activityValue ->
                    defaultModel
                        |> update (AddProfile activityValue)
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.has [ Slc.text activityValue ]
            , test "new profile label has a button" <|
                \_ ->
                    { defaultModel | profiles = Labels.fromList [ "profileName" ] }
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.containing [ Slc.text "profileName" ] ]
                        |> Query.has [ Slc.tag "button" ]
            , fuzz string "updated profiles list is sent updateProfiles port" <|
                \activityValue ->
                    defaultModel
                        |> update (AddProfile activityValue)
                        |> Tuple.second
                        |> Expect.equal (Ports.updateProfiles [ activityValue ])
            ]
        , describe "when AddProfile is triggered multiple times"
            [ fuzz (list string) "corresponding profile labels are created" <|
                \activityValues ->
                    let
                        model =
                            List.foldl
                                (\value acc ->
                                    acc
                                        |> update (AddProfile value)
                                        |> Tuple.first
                                )
                                defaultModel
                                activityValues

                        profile =
                            List.map (\value -> Slc.containing [ Slc.text value ]) activityValues
                    in
                    model
                        |> view
                        |> Query.fromHtml
                        |> Query.has
                            [ Slc.all profile ]
            ]
        , describe "give profile label delete button"
            [ fuzz2 string string "when user clicks it, RemoveProfile is triggered with correct profile" <|
                \profile1 profile2 ->
                    { defaultModel | profiles = Labels.fromList [ profile1, profile2 ] }
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.id profile1 ]
                        |> Event.simulate Event.click
                        |> Event.expect (RemoveProfile profile1)
            , test "when RemoveProfile is triggered with a profile the corresponding label disappears" <|
                \_ ->
                    { defaultModel | profiles = Labels.fromList [ "profile1", "profile2" ] }
                        |> update (RemoveProfile "profile1")
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.hasNot [ Slc.id "profile1" ]
            , test "when RemoveProfile is triggered with a profile the other labels don't disappear" <|
                \_ ->
                    { defaultModel | profiles = Labels.fromList [ "profile1", "profile2" ] }
                        |> update (RemoveProfile "profile1")
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.has [ Slc.id "profile2" ]
            , test "when RemoveProfile is triggered updated profile list is sent to updateProfiles port" <|
                \_ ->
                    { defaultModel | profiles = Labels.fromList [ "profile1", "profile2" ] }
                        |> update (RemoveProfile "profile1")
                        |> Tuple.second
                        |> Expect.equal (Ports.updateProfiles [ "profile2" ])
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
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.for "checkbox-crowd-map" ]
                    |> Query.contains
                        [ text "Crowd Map" ]
        , test "checkbox is not checked as default" <|
            \_ ->
                defaultModel
                    |> view
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
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "checkbox-crowd-map" ]
                    |> Query.has
                        [ Slc.attribute <| Attr.checked model.isCrowdMapOn ]
        , test "clicking the checkbox sends ToggleCrowdMap message" <|
            \_ ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "checkbox-crowd-map" ]
                    |> Event.simulate Event.click
                    |> Event.expect ToggleCrowdMap
        , test "slider has a description" <|
            \_ ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "crowd-map-slider" ]
                    |> Query.contains
                        [ text "Resolution" ]
        , test "slider has a description with current crowd map resolution" <|
            \_ ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "crowd-map-slider" ]
                    |> Query.contains
                        [ text (String.fromInt defaultModel.crowdMapResolution) ]
        , test "slider default value is 25" <|
            \_ ->
                defaultModel
                    |> view
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
                    |> view
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
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.class "crowd-map-slider" ]
                    |> Event.simulate (Event.custom "change" simulatedEventObject)
                    |> Event.expect (UpdateCrowdMapResolution resolution)
        ]

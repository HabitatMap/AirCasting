module MobileSessionsFiltersTests exposing (crowdMapArea, locationFilter, parameterSensorFilter, popups, profilesArea, tagsArea, timeFilter)

import Expect
import Fuzz exposing (bool, int, list, string)
import Html exposing (text)
import Html.Attributes as Attr
import Json.Encode as Encode
import LabelsInput
import MobileSessionsFilters exposing (..)
import Ports
import Test exposing (..)
import Test.Html.Event as Event
import Test.Html.Query as Query
import Test.Html.Selector as Slc
import TimeRange


popups : Test
popups =
    describe "Popup tests: "
        [ test "when ClosePopup is triggered the popup is hidden" <|
            \_ ->
                { defaultModel | popup = SelectFromItems { main = [], other = Nothing } }
                    |> update ClosePopup
                    |> Tuple.first
                    |> view
                    |> Query.fromHtml
                    |> Query.hasNot [ Slc.id "popup" ]
        , fuzz (list string) "popup shows main items" <|
            \items ->
                let
                    itemsHtml =
                        List.map (\item -> Slc.containing [ Slc.text item ]) items
                in
                { main = items, other = Nothing }
                    |> viewPopup SelectParameter False
                    |> Query.fromHtml
                    |> Query.has [ Slc.all itemsHtml ]
        , fuzz2 (list string) (list string) "popup shows only main items when not extended" <|
            \mainItems otherItems ->
                { main = mainItems, other = Just otherItems }
                    |> viewPopup SelectParameter False
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.tag "li" ]
                    |> Query.count (Expect.equal (List.length mainItems))
        , test "if there are no other items popup doesn't have a toggle popup button" <|
            \_ ->
                { main = [], other = Nothing }
                    |> viewPopup SelectParameter False
                    |> Query.fromHtml
                    |> Query.hasNot [ Slc.id "toggle-popup-button" ]
        , test "if there are other items popup has a button that triggers TogglePopupState" <|
            \_ ->
                { main = [], other = Just [ "item" ] }
                    |> viewPopup SelectParameter False
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "toggle-popup-button" ]
                    |> Event.simulate Event.click
                    |> Event.expect TogglePopupState
        , test "TogglePopupState toggles the popup state" <|
            \_ ->
                defaultModel
                    |> update TogglePopupState
                    |> Tuple.first
                    |> .isPopupExtended
                    |> Expect.equal True
        , fuzz2 (list string) (list string) "popup shows all items when extended" <|
            \mainItems otherItems ->
                let
                    numberOfItems =
                        List.length mainItems + List.length otherItems
                in
                { main = mainItems, other = Just otherItems }
                    |> viewPopup SelectParameter True
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.tag "li" ]
                    |> Query.count (Expect.equal numberOfItems)
        , test "clicking on an item executes select function" <|
            \_ ->
                { main = [ "item" ], other = Nothing }
                    |> viewPopup SelectParameter False
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "button", Slc.containing [ Slc.text "item" ] ]
                    |> Event.simulate Event.click
                    |> Event.expect (SelectParameter "item")
        ]


parameterSensorFilter : Test
parameterSensorFilter =
    describe "Parameter filter tests: "
        [ fuzz string "parameter filter shows the selected parameter" <|
            \parameter ->
                { defaultModel | selectedParameter = parameter }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "parameter-filter" ]
                    |> Query.has [ Slc.attribute <| Attr.value parameter ]
        , test "Clicking on parameter filter triggers ShowSelectFormItemsPopup" <|
            \_ ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "parameter-filter" ]
                    |> Event.simulate Event.click
                    |> Event.expect ShowSelectFormItemsPopup
        , test "when ShowSelectFormItemsPopup is triggered popup is shown" <|
            \_ ->
                defaultModel
                    |> update ShowSelectFormItemsPopup
                    |> Tuple.first
                    |> view
                    |> Query.fromHtml
                    |> Query.has [ Slc.id "popup" ]
        ]


locationFilter : Test
locationFilter =
    describe "Location filter tests:"
        [ test "Location filter is present" <|
            \_ ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.has [ Slc.id "location-filter" ]
        , fuzz string "when user types UpdateLocationInput is triggered" <|
            \locationValue ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "location-filter" ]
                    |> Event.simulate (Event.input locationValue)
                    |> Event.expect (UpdateLocationInput locationValue)
        , fuzz string "when UpdateLocationInput is triggered new input value is visible" <|
            \locationValue ->
                defaultModel
                    |> update (UpdateLocationInput locationValue)
                    |> Tuple.first
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "location-filter" ]
                    |> Query.has [ Slc.attribute <| Attr.value locationValue ]
        , test "when Enter key is pressed SubmitLocation is triggered" <|
            \_ ->
                let
                    enterKeydownEvent : Encode.Value
                    enterKeydownEvent =
                        Encode.object [ ( "keyCode", Encode.int 13 ) ]
                in
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "location-filter" ]
                    |> Event.simulate (Event.custom "keydown" enterKeydownEvent)
                    |> Event.expect SubmitLocation
        , fuzz string "when SubmitLocation is triggered Port.findLocation is called with current location field value" <|
            \location ->
                { defaultModel | location = location }
                    |> update SubmitLocation
                    |> Tuple.second
                    |> Expect.equal (Ports.findLocation location)
        ]


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


tagsArea : Test
tagsArea =
    describe "Tags area tests: "
        [ describe "when new tag is added "
            [ fuzz string "new tag is created" <|
                \tag ->
                    defaultModel
                        |> update (TagsLabels <| LabelsInput.Add tag)
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.has [ Slc.text tag ]
            , test "new tag has a button" <|
                \_ ->
                    { defaultModel | tags = LabelsInput.fromList [ "tag" ] }
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.containing [ Slc.text "tag" ] ]
                        |> Query.has [ Slc.tag "button" ]
            , test "updated tags list is sent updateTags port" <|
                \_ ->
                    { defaultModel | tags = LabelsInput.fromList [ "oldTag" ] }
                        |> update (TagsLabels <| LabelsInput.Add "newTag")
                        |> Tuple.second
                        |> Expect.equal (Cmd.map TagsLabels <| Ports.updateTags [ "newTag", "oldTag" ])
            ]
        , describe "when multiple tags are added"
            [ fuzz (list string) "corresponding tags are created" <|
                \tags ->
                    let
                        model =
                            List.foldl
                                (\value acc ->
                                    acc
                                        |> update (TagsLabels <| LabelsInput.Add value)
                                        |> Tuple.first
                                )
                                defaultModel
                                tags

                        expected =
                            List.map (\value -> Slc.containing [ Slc.text value ]) tags
                    in
                    model
                        |> view
                        |> Query.fromHtml
                        |> Query.has
                            [ Slc.all expected ]
            ]
        , describe "give tags delete button"
            [ test "when user clicks it, Remove is triggered with correct tag content" <|
                \_ ->
                    { defaultModel | tags = LabelsInput.fromList [ "tag1", "tag2" ] }
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.id "tag1" ]
                        |> Event.simulate Event.click
                        |> Event.expect (TagsLabels <| LabelsInput.Remove "tag1")
            , test "when Remove is triggered with a tag content the corresponding tag disappears" <|
                \_ ->
                    { defaultModel | tags = LabelsInput.fromList [ "tag1", "tag2" ] }
                        |> update (TagsLabels <| LabelsInput.Remove "tag1")
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.hasNot [ Slc.id "tag1" ]
            , test "when Remove is triggered with a tag content the other tags don't disappear" <|
                \_ ->
                    { defaultModel | tags = LabelsInput.fromList [ "tag1", "tag2" ] }
                        |> update (TagsLabels <| LabelsInput.Remove "tag1")
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.has [ Slc.id "tag2" ]
            , test "when Remove is triggered updated tags list is sent updateTags port" <|
                \_ ->
                    { defaultModel | tags = LabelsInput.fromList [ "firstTag", "secondTag" ] }
                        |> update (TagsLabels <| LabelsInput.Remove "firstTag")
                        |> Tuple.second
                        |> Expect.equal (Cmd.map TagsLabels <| Ports.updateTags [ "secondTag" ])
            ]
        ]


profilesArea : Test
profilesArea =
    describe "Profile names tests: "
        [ describe "when Add is triggered"
            [ fuzz string "new profile label is created" <|
                \profile ->
                    defaultModel
                        |> update (ProfileLabels <| LabelsInput.Add profile)
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.has [ Slc.text profile ]
            , test "new profile label has a button" <|
                \_ ->
                    { defaultModel | profiles = LabelsInput.fromList [ "profileName" ] }
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.containing [ Slc.text "profileName" ] ]
                        |> Query.has [ Slc.tag "button" ]
            , fuzz string "updated profiles list is sent updateProfiles port" <|
                \profile ->
                    defaultModel
                        |> update (ProfileLabels <| LabelsInput.Add profile)
                        |> Tuple.second
                        |> Expect.equal (Cmd.map ProfileLabels <| Ports.updateProfiles [ profile ])
            ]
        , describe "when Add is triggered multiple times"
            [ fuzz (list string) "corresponding profile labels are created" <|
                \profiles ->
                    let
                        model =
                            List.foldl
                                (\value acc ->
                                    acc
                                        |> update (ProfileLabels <| LabelsInput.Add value)
                                        |> Tuple.first
                                )
                                defaultModel
                                profiles

                        profile =
                            List.map (\value -> Slc.containing [ Slc.text value ]) profiles
                    in
                    model
                        |> view
                        |> Query.fromHtml
                        |> Query.has
                            [ Slc.all profile ]
            ]
        , describe "give profile label delete button"
            [ fuzz2 string string "when user clicks it, Remove is triggered with correct profile" <|
                \profile1 profile2 ->
                    { defaultModel | profiles = LabelsInput.fromList [ profile1, profile2 ] }
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.id profile1 ]
                        |> Event.simulate Event.click
                        |> Event.expect (ProfileLabels <| LabelsInput.Remove profile1)
            , test "when Remove is triggered with a profile the corresponding label disappears" <|
                \_ ->
                    { defaultModel | profiles = LabelsInput.fromList [ "profile1", "profile2" ] }
                        |> update (ProfileLabels <| LabelsInput.Remove "profile1")
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.hasNot [ Slc.id "profile1" ]
            , test "when Remove is triggered with a profile the other labels don't disappear" <|
                \_ ->
                    { defaultModel | profiles = LabelsInput.fromList [ "profile1", "profile2" ] }
                        |> update (ProfileLabels <| LabelsInput.Remove "profile1")
                        |> Tuple.first
                        |> view
                        |> Query.fromHtml
                        |> Query.has [ Slc.id "profile2" ]
            , test "when Remove is triggered updated profile list is sent to updateProfiles port" <|
                \_ ->
                    { defaultModel | profiles = LabelsInput.fromList [ "profile1", "profile2" ] }
                        |> update (ProfileLabels <| LabelsInput.Remove "profile1")
                        |> Tuple.second
                        |> Expect.equal (Cmd.map ProfileLabels <| Ports.updateProfiles [ "profile2" ])
            ]
        ]


crowdMapArea : Test
crowdMapArea =
    describe "Crowd Map filter test: "
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
        , test "checkbox has a correct label" <|
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

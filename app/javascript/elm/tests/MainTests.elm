module MainTests exposing (crowdMapArea, indoorFilter, locationFilter, parameterSensorFilter, popups, profilesArea, session, sessionWithId, sessionWithTitle, shortTypes, tagsArea, timeFilter, updateTests, viewTests)

import Data.Session exposing (..)
import Expect
import Fuzz exposing (bool, int, intRange, list, string)
import Html exposing (text)
import Html.Attributes as Attr
import Json.Encode as Encode
import LabelsInput
import Main exposing (..)
import Popup
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
                { defaultModel | popup = Popup.SelectFromItems { main = [], other = Nothing } }
                    |> update ClosePopup
                    |> Tuple.first
                    |> view
                    |> Query.fromHtml
                    |> Query.hasNot [ Slc.id "popup" ]
        , test "TogglePopupState toggles the popup state" <|
            \_ ->
                defaultModel
                    |> update TogglePopupState
                    |> Tuple.first
                    |> .isPopupExtended
                    |> Expect.equal True
        ]


parameterSensorFilter : Test
parameterSensorFilter =
    describe "Parameter filter tests: "
        [ fuzz string "parameter filter shows the selected parameter" <|
            \parameter ->
                { defaultModel | selectedParameter = parameter }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "parameter" ]
                    |> Query.has [ Slc.attribute <| Attr.value parameter ]
        , test "Clicking on parameter filter triggers ShowSelectFormItemsPopup" <|
            \_ ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "parameter" ]
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
                    |> Query.has [ Slc.id "location" ]
        , fuzz string "when user types UpdateLocationInput is triggered" <|
            \locationValue ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "location" ]
                    |> Event.simulate (Event.input locationValue)
                    |> Event.expect (UpdateLocationInput locationValue)
        , fuzz string "when UpdateLocationInput is triggered new input value is visible" <|
            \locationValue ->
                defaultModel
                    |> update (UpdateLocationInput locationValue)
                    |> Tuple.first
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "location" ]
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
                    |> Query.find [ Slc.id "location" ]
                    |> Event.simulate (Event.custom "keydown" enterKeydownEvent)
                    |> Event.expect SubmitLocation
        , fuzz string "when SubmitLocation is triggered Port.findLocation is called with current location field value" <|
            \location ->
                { defaultModel | location = location }
                    |> update SubmitLocation
                    |> Tuple.second
                    |> Expect.equal (Ports.findLocation location)
        , test "is disabled when showing indoor sessions" <|
            \_ ->
                { defaultModel | isIndoor = True }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "location" ]
                    |> Query.has [ Slc.attribute <| Attr.disabled True ]
        ]


timeFilter : Test
timeFilter =
    describe "Time filter tests: "
        [ test "Time filter is present" <|
            \_ ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.has [ Slc.id "time-range" ]
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
                { defaultModel | isCrowdMapOn = True }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "crowd-map-slider" ]
                    |> Query.contains
                        [ text "Resolution" ]
        , test "slider has a description with current crowd map resolution" <|
            \_ ->
                { defaultModel | isCrowdMapOn = True }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "crowd-map-slider" ]
                    |> Query.contains
                        [ text (String.fromInt defaultModel.crowdMapResolution) ]
        , test "slider default value is 25" <|
            \_ ->
                { defaultModel | isCrowdMapOn = True }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.class "crowd-map-slider" ]
                    |> Query.has
                        [ Slc.attribute <| Attr.value "25" ]
        , fuzz int "slider value depends on model.crowdMapResolution" <|
            \resolution ->
                let
                    model =
                        { defaultModel | isCrowdMapOn = True, crowdMapResolution = resolution }
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
                { defaultModel | isCrowdMapOn = True }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.class "crowd-map-slider" ]
                    |> Event.simulate (Event.custom "change" simulatedEventObject)
                    |> Event.expect (UpdateCrowdMapResolution resolution)
        ]


indoorFilter : Test
indoorFilter =
    describe "indoor/outdoor filter tests:"
        [ test "filter is displayed" <|
            \_ ->
                { defaultModel | page = Fixed }
                    |> view
                    |> Query.fromHtml
                    |> Query.has [ Slc.attribute <| Attr.id "indoor-filter" ]
        , test "checkbox is not checked as default" <|
            \_ ->
                { defaultModel | page = Fixed }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "indoor-filter" ]
                    |> Query.has [ Slc.attribute <| Attr.checked False ]
        , fuzz bool "interacting with checkbox changes 'checked' value" <|
            \isIndoor ->
                { defaultModel | page = Fixed }
                    |> update (ToggleIndoor isIndoor)
                    |> Tuple.first
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "indoor-filter" ]
                    |> Query.has [ Slc.attribute <| Attr.checked isIndoor ]
        , fuzz bool "interacting with checkbox triggers ToggleIndoor" <|
            \isIndoor ->
                { defaultModel | page = Fixed }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| Attr.id "indoor-filter" ]
                    |> Event.simulate (Event.check isIndoor)
                    |> Event.expect (ToggleIndoor isIndoor)
        , fuzz bool "ToggleIndoor triggers Ports.toggleIndoor with 'checked' value" <|
            \isIndoor ->
                { defaultModel | page = Fixed }
                    |> update (ToggleIndoor isIndoor)
                    |> Tuple.second
                    |> Expect.equal (Ports.toggleIndoor isIndoor)
        ]


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
                { defaultModel | sessions = [ sessionWithTitle title1, sessionWithTitle title2 ], selectedSessionId = Nothing }
                    |> view
                    |> Query.fromHtml
                    |> Query.contains
                        [ Html.text title1
                        , Html.text title2
                        ]
        , fuzz (intRange 1 10) "with modulo 50 sessions in the model the load more button is shown" <|
            \times ->
                { defaultModel | sessions = List.repeat (50 * times) session, selectedSessionId = Nothing }
                    |> view
                    |> Query.fromHtml
                    |> Query.contains [ Html.text "Load More..." ]
        , test "with 0 sessions in the model the load more button is not shown" <|
            \times ->
                { defaultModel | sessions = [], selectedSessionId = Nothing }
                    |> view
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.text "Load More..." ]
                    |> Query.count (Expect.equal 0)
        , fuzz int "with 1 sessions in the model the export link is correctly generated" <|
            \id ->
                let
                    expected =
                        exportPath ++ "?session_ids[]=" ++ String.fromInt id
                in
                { defaultModel | sessions = [ sessionWithId id ] }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.containing [ Slc.text "export sessions" ] ]
                    |> Query.has [ Slc.attribute <| Attr.href expected ]
        , fuzz int "with 2 sessions in the model the export link is correctly generated" <|
            \id ->
                let
                    expected =
                        exportPath ++ "?session_ids[]=" ++ String.fromInt id ++ "&session_ids[]=" ++ String.fromInt (id + 1)
                in
                { defaultModel | sessions = [ sessionWithId id, sessionWithId (id + 1) ] }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.containing [ Slc.text "export sessions" ] ]
                    |> Query.has [ Slc.attribute <| Attr.href expected ]
        ]


updateTests : Test
updateTests =
    describe "update"
        [ fuzz int "with no selections ToggleSessionSelection selects the passed id" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSessionId = Nothing }

                    expected =
                        { model | selectedSessionId = Just id }
                in
                model
                    |> update (ToggleSessionSelection id)
                    |> Tuple.first
                    |> Expect.equal expected
        , fuzz int "when id was selected ToggleSessionSelection deselects it" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSessionId = Just id }

                    expected =
                        { model | selectedSessionId = Nothing }
                in
                model
                    |> update (ToggleSessionSelection id)
                    |> Tuple.first
                    |> Expect.equal expected
        , fuzz int "when another id was selected ToggleSessionSelection selects the new one" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSessionId = Just (id + 1) }

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
                        { defaultModel | sessions = [ sessionWithId id, sessionWithId (id + 1) ], selectedSessionId = Nothing }

                    expected =
                        Ports.checkedSession { selected = Just (id + 1), deselected = Nothing }
                in
                model
                    |> update (ToggleSessionSelection (id + 1))
                    |> Tuple.second
                    |> Expect.equal expected
        , fuzz int "when session was selected ToggleSessionSelection tells javascript what was deselected" <|
            \id ->
                let
                    model =
                        { defaultModel | sessions = [ sessionWithId id, sessionWithId (id + 1) ], selectedSessionId = Just (id + 1) }

                    expected =
                        Ports.checkedSession { selected = Nothing, deselected = Just (id + 1) }
                in
                model
                    |> update (ToggleSessionSelection (id + 1))
                    |> Tuple.second
                    |> Expect.equal expected
        , fuzz int "when another session was selected ToggleSessionSelection tells javascript what was selected and what was deselected" <|
            \id ->
                let
                    model =
                        { defaultModel | sessions = [ sessionWithId id, sessionWithId (id + 1) ], selectedSessionId = Just (id + 1) }

                    expected =
                        Ports.checkedSession { selected = Just id, deselected = Just (id + 1) }
                in
                model
                    |> update (ToggleSessionSelection id)
                    |> Tuple.second
                    |> Expect.equal expected
        , fuzz int "UpdateSessions replaces sessions in the model" <|
            \id ->
                let
                    model =
                        { defaultModel | sessions = [ sessionWithId id ], selectedSessionId = Nothing }

                    newSessions =
                        [ sessionWithId (id + 1) ]
                in
                model
                    |> update (UpdateSessions newSessions)
                    |> Tuple.first
                    |> .sessions
                    |> Expect.equal newSessions
        , fuzz int "LoadMoreSessions delegates to javascript" <|
            \id ->
                let
                    model =
                        { defaultModel | sessions = [], selectedSessionId = Nothing }
                in
                model
                    |> update LoadMoreSessions
                    |> Tuple.second
                    |> Expect.equal (Ports.loadMoreSessions ())
        , fuzz int "DeselectSession deselects the selected id" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSessionId = Just id }

                    expected =
                        { model | selectedSessionId = Nothing }
                in
                model
                    |> update DeselectSession
                    |> Tuple.first
                    |> Expect.equal expected
        , fuzz int "DeselectSession tells javascript what to deselect" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSessionId = Just id }

                    expected =
                        Ports.checkedSession { deselected = Just id, selected = Nothing }
                in
                model
                    |> update DeselectSession
                    |> Tuple.second
                    |> Expect.equal expected
        , fuzz int "with Just ToggleSessionSelectionFromAngular selects the passed id" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSessionId = Nothing }

                    expected =
                        { model | selectedSessionId = Just id }
                in
                model
                    |> update (ToggleSessionSelectionFromAngular <| Just id)
                    |> Tuple.first
                    |> Expect.equal expected
        , fuzz int "with Nothing ToggleSessionSelectionFromAngular deselects the selected id" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSessionId = Just id }

                    expected =
                        { model | selectedSessionId = Nothing }
                in
                model
                    |> update (ToggleSessionSelectionFromAngular Nothing)
                    |> Tuple.first
                    |> Expect.equal expected
        ]

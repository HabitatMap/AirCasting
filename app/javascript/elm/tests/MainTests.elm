module MainTests exposing (crowdMapArea, locationFilter, parameterSensorFilter, popups, profilesArea, session, sessionWithId, sessionWithTitle, shortTypes, tagsArea, timeFilter, toggleIndoorFilter, updateTests, viewTests)

import Data.Page exposing (Page(..))
import Data.SelectedSession exposing (SelectedSession)
import Data.Session exposing (..)
import Expect
import Fuzz exposing (bool, float, int, intRange, list, string)
import Html exposing (text)
import Html.Attributes exposing (checked, class, disabled, for, href, id, value)
import Html.Attributes.Aria exposing (ariaLabel)
import Json.Encode as Encode
import LabelsInput
import Main exposing (..)
import Popup
import Ports
import RemoteData exposing (RemoteData(..))
import Sensor
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
                { defaultModel | popup = Popup.SelectFrom ( [], [] ) "" "" }
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


sensors : List Sensor.Sensor
sensors =
    [ { parameter = "parameter"
      , name = "Sensor"
      , unit = "unit"
      , session_count = 1
      }
    ]


parameterSensorFilter : Test
parameterSensorFilter =
    describe "Parameter filter tests: "
        [ test "parameter filter shows parameter name based on selectedSensorId" <|
            \_ ->
                { defaultModel
                    | selectedSensorId = "parameter-sensor (unit)"
                    , sensors = sensors
                }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "parameter" ]
                    |> Query.has [ Slc.attribute <| value "parameter" ]
        , test "sensor filter shows sensor label based on selectedSensorId" <|
            \_ ->
                { defaultModel
                    | selectedSensorId = "parameter-sensor (unit)"
                    , sensors = sensors
                }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "sensor" ]
                    |> Query.has [ Slc.attribute <| value "Sensor (unit)" ]
        , test "when ShowPopup is triggered popup is shown" <|
            \_ ->
                defaultModel
                    |> update (ShowPopup ( [], [] ) "" "")
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
                    |> Query.has [ Slc.attribute <| value locationValue ]
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
                    |> Query.has [ Slc.attribute <| disabled True ]
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
                        { defaultModel | timeRange = TimeRange.update defaultModel.timeRange value }
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
            , test "input is disabled when showing fixed indoor sessions" <|
                \_ ->
                    { defaultModel | isIndoor = True, page = Fixed }
                        |> view
                        |> Query.fromHtml
                        |> Query.find [ Slc.id "profile-names" ]
                        |> Query.has [ Slc.attribute <| disabled True ]
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
                    |> Query.find [ Slc.attribute <| for "checkbox-crowd-map" ]
                    |> Query.contains
                        [ text "Crowd Map" ]
        , test "checkbox is not checked as default" <|
            \_ ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| id "checkbox-crowd-map" ]
                    |> Query.has
                        [ Slc.attribute <| checked False ]
        , fuzz bool "checkbox state depends on model.isCrowdMapOn" <|
            \onOffValue ->
                let
                    model =
                        { defaultModel | isCrowdMapOn = onOffValue }
                in
                model
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| id "checkbox-crowd-map" ]
                    |> Query.has
                        [ Slc.attribute <| checked model.isCrowdMapOn ]
        , test "clicking the checkbox sends ToggleCrowdMap message" <|
            \_ ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| id "checkbox-crowd-map" ]
                    |> Event.simulate Event.click
                    |> Event.expect ToggleCrowdMap
        , test "slider has a description" <|
            \_ ->
                { defaultModel | isCrowdMapOn = True }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| id "crowd-map-slider" ]
                    |> Query.contains
                        [ text "Resolution" ]
        , test "slider has a description with current crowd map resolution" <|
            \_ ->
                { defaultModel | isCrowdMapOn = True }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| id "crowd-map-slider" ]
                    |> Query.contains
                        [ text (String.fromInt defaultModel.crowdMapResolution) ]
        , test "slider default value is 25" <|
            \_ ->
                { defaultModel | isCrowdMapOn = True }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| class "crowd-map-slider" ]
                    |> Query.has
                        [ Slc.attribute <| value "25" ]
        , fuzz int "slider value depends on model.crowdMapResolution" <|
            \resolution ->
                let
                    model =
                        { defaultModel | isCrowdMapOn = True, crowdMapResolution = resolution }
                in
                model
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| class "crowd-map-slider" ]
                    |> Query.has
                        [ Slc.attribute <| value (String.fromInt resolution) ]
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
                    |> Query.find [ Slc.attribute <| class "crowd-map-slider" ]
                    |> Event.simulate (Event.custom "change" simulatedEventObject)
                    |> Event.expect (UpdateCrowdMapResolution resolution)
        ]


toggleIndoorFilter : Test
toggleIndoorFilter =
    describe "indoor/outdoor filter tests:"
        [ test "toggle is displayed" <|
            \_ ->
                { defaultModel | page = Fixed }
                    |> view
                    |> Query.fromHtml
                    |> Expect.all
                        [ Query.has [ Slc.attribute <| ariaLabel "indoor" ]
                        , Query.has [ Slc.attribute <| ariaLabel "outdoor" ]
                        ]
        , test "outdoor is selected by default" <|
            \_ ->
                { defaultModel | page = Fixed }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| ariaLabel "outdoor" ]
                    |> Query.has [ Slc.attribute <| class "toggle-button--pressed" ]
        , test "clicking indoor button triggers ToggleIndoor" <|
            \_ ->
                { defaultModel | page = Fixed }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| ariaLabel "indoor" ]
                    |> Event.simulate Event.click
                    |> Event.expect ToggleIndoor
        , test "clicking outdoor button triggers ToggleIndoor" <|
            \_ ->
                { defaultModel | page = Fixed }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| ariaLabel "outdoor" ]
                    |> Event.simulate Event.click
                    |> Event.expect ToggleIndoor
        , test "when indoor false ToggleIndoor triggers Ports.toggleIndoor with True and Ports.updateProfiles with []" <|
            \_ ->
                { defaultModel | page = Fixed }
                    |> update ToggleIndoor
                    |> Tuple.second
                    |> Expect.equal (Cmd.batch [ Ports.toggleIndoor True, Ports.updateProfiles [] ])
        , test "when is indoor true ToggleIndoor triggers Ports.toggleIndoor with False" <|
            \_ ->
                { defaultModel | page = Fixed, isIndoor = True }
                    |> update ToggleIndoor
                    |> Tuple.second
                    |> Expect.equal (Ports.toggleIndoor False)
        ]


shortTypes : List ShortType
shortTypes =
    [ { name = "name", type_ = "type_" } ]


session : Session
session =
    { title = "title"
    , id = 1
    , startTime = "start time"
    , endTime = "end time"
    , username = "username"
    , shortTypes = shortTypes
    }


sessionWithId : Int -> Session
sessionWithId id =
    { session | id = id }


sessionWithTitle : String -> Session
sessionWithTitle title =
    { session | title = title }


selectedSession =
    { title = "title"
    , username = "username"
    , sensorName = "sensor-name"
    , average = 2.0
    , min = 1.0
    , max = 3.0
    , startTime = "start time"
    , endTime = "end time"
    , measurements = [ 1.0, 2.0, 3.0 ]
    , id = 123
    }


selectedSessionWithId : Int -> SelectedSession
selectedSessionWithId id =
    { selectedSession | id = id }


viewTests : Test
viewTests =
    describe "view"
        [ fuzz2 string string "with no selection session titles are displayed in the list" <|
            \title1 title2 ->
                { defaultModel | sessions = [ sessionWithTitle title1, sessionWithTitle title2 ], selectedSession = NotAsked }
                    |> view
                    |> Query.fromHtml
                    |> Query.contains
                        [ Html.text title1
                        , Html.text title2
                        ]
        , fuzz (intRange 1 10) "with no selection and modulo 50 sessions in the model the load more button is shown" <|
            \times ->
                { defaultModel | sessions = List.repeat (50 * times) session, selectedSession = NotAsked }
                    |> view
                    |> Query.fromHtml
                    |> Query.contains [ Html.text "Load More..." ]
        , test "with no selection and 0 sessions in the model the load more button is not shown" <|
            \times ->
                { defaultModel | sessions = [], selectedSession = NotAsked }
                    |> view
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.text "Load More..." ]
                    |> Query.count (Expect.equal 0)
        , fuzz int "with no selection and 1 sessions in the model the export link is correctly generated" <|
            \id ->
                let
                    expected =
                        exportPath ++ "?session_ids[]=" ++ String.fromInt id
                in
                { defaultModel | sessions = [ sessionWithId id ], selectedSession = NotAsked }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.containing [ Slc.text "export sessions" ] ]
                    |> Query.has [ Slc.attribute <| href expected ]
        , fuzz int "with no selection and 2 sessions in the model the export link is correctly generated" <|
            \id ->
                let
                    expected =
                        exportPath ++ "?session_ids[]=" ++ String.fromInt id ++ "&session_ids[]=" ++ String.fromInt (id + 1)
                in
                { defaultModel | sessions = [ sessionWithId id, sessionWithId (id + 1) ], selectedSession = NotAsked }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.containing [ Slc.text "export sessions" ] ]
                    |> Query.has [ Slc.attribute <| href expected ]
        , test "with selection graph is shown" <|
            \_ ->
                { defaultModel | selectedSession = Success selectedSession }
                    |> view
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.id "graph" ]
                    |> Query.count (Expect.equal 1)
        , test "with selection a button to deselect session is shown" <|
            \_ ->
                { defaultModel | selectedSession = Success selectedSession }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "button", Slc.containing [ Slc.text "X" ] ]
                    |> Event.simulate Event.click
                    |> Event.expect DeselectSession
        , fuzz3 string string string "with selection the session title username and sensorName are shown" <|
            \title username sensorName ->
                let
                    selectedSession_ =
                        { selectedSession
                            | title = title
                            , username = username
                            , sensorName = sensorName
                        }

                    expected =
                        List.map (\x -> Slc.containing [ Slc.text x ]) [ title, username, sensorName ]
                in
                { defaultModel | selectedSession = Success selectedSession_ }
                    |> view
                    |> Query.fromHtml
                    |> Query.has [ Slc.all expected ]
        , fuzz3 float float float "with selection the session rounded average min and max are shown" <|
            \average min max ->
                let
                    selectedSession_ =
                        { selectedSession
                            | average = average
                            , min = min
                            , max = max
                        }

                    expected =
                        List.map (\x -> Slc.containing [ Slc.text x ]) [ String.fromInt <| round average, String.fromFloat min, String.fromFloat max ]
                in
                { defaultModel | selectedSession = Success selectedSession_ }
                    |> view
                    |> Query.fromHtml
                    |> Query.has [ Slc.all expected ]
        , fuzz2 string string "with selection the session startTime and endTime is shown" <|
            \startTime endTime ->
                let
                    selectedSession_ =
                        { selectedSession | startTime = startTime, endTime = endTime }

                    expected =
                        List.map (\x -> Slc.containing [ Slc.text x ]) [ startTime, endTime ]
                in
                { defaultModel | selectedSession = Success selectedSession_ }
                    |> view
                    |> Query.fromHtml
                    |> Query.has [ Slc.all expected ]
        ]


updateTests : Test
updateTests =
    describe "update"
        [ fuzz int "when passed the selected session ToggleSessionSelection deselects it" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSession = Success <| selectedSessionWithId id }

                    expected =
                        { model | selectedSession = NotAsked }
                in
                model
                    |> update (ToggleSessionSelection id)
                    |> Tuple.first
                    |> Expect.equal expected
        , fuzz int "when passed another session ToggleSessionSelection deselects the selected session" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSession = Success <| selectedSessionWithId id }

                    expected =
                        { model | selectedSession = NotAsked }
                in
                model
                    |> update (ToggleSessionSelection (id + 1))
                    |> Tuple.first
                    |> Expect.equal expected
        , fuzz int "when session was selected ToggleSessionSelection tells javascript what was deselected" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSession = Success <| selectedSessionWithId id }

                    expected =
                        Ports.toggleSession { selected = Nothing, deselected = Just id }
                in
                model
                    |> update (ToggleSessionSelection id)
                    |> Tuple.second
                    |> Expect.equal expected
        , fuzz int "UpdateSessions replaces sessions in the model" <|
            \id ->
                let
                    model =
                        { defaultModel | sessions = [ sessionWithId id ], selectedSession = NotAsked }

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
                        { defaultModel | sessions = [], selectedSession = NotAsked }
                in
                model
                    |> update LoadMoreSessions
                    |> Tuple.second
                    |> Expect.equal (Ports.loadMoreSessions ())
        , fuzz int "DeselectSession deselects the selected session" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSession = Success <| selectedSessionWithId id }

                    expected =
                        { model | selectedSession = NotAsked }
                in
                model
                    |> update DeselectSession
                    |> Tuple.first
                    |> Expect.equal expected
        , fuzz int "DeselectSession tells javascript what to deselect" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSession = Success <| selectedSessionWithId id }

                    expected =
                        Ports.toggleSession { deselected = Just id, selected = Nothing }
                in
                model
                    |> update DeselectSession
                    |> Tuple.second
                    |> Expect.equal expected
        , fuzz int "with Nothing ToggleSessionSelectionFromAngular deselects the selected id" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSession = Success <| selectedSessionWithId id }

                    expected =
                        { model | selectedSession = NotAsked }
                in
                model
                    |> update (ToggleSessionSelectionFromAngular Nothing)
                    |> Tuple.first
                    |> Expect.equal expected
        ]

module MainTests exposing (crowdMapArea, locationFilter, parameterSensorFilter, popups, profilesArea, tagsArea, timeFilter, toggleIndoorFilter, toggleStatusFilter, updateTests, viewTests)

import Data.BoundedInteger as BoundedInteger exposing (LowerBound(..), UpperBound(..), Value(..))
import Data.Page exposing (Page(..))
import Data.Status exposing (Status(..))
import Expect
import Fuzz exposing (bool, int, intRange, list, string)
import Html exposing (text)
import Html.Attributes exposing (checked, class, disabled, id, value)
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
import TestUtils exposing (defaultSelectedSession, defaultSession, heatMapThresholdsWithMaximum, heatMapThresholdsWithMinimum, simulatedEventObject)
import Time
import TimeRange


popups : Test
popups =
    describe "Popup tests: "
        [ test "when ClosePopup is triggered the popup is hidden" <|
            \_ ->
                { defaultModel | popup = Popup.SensorList }
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
                    |> .isPopupListExpanded
                    |> Expect.equal True
        ]


parameterSensorFilter : Test
parameterSensorFilter =
    describe "Parameter filter tests: "
        [ test "parameter filter shows parameter name based on selectedSensorId" <|
            \_ ->
                let
                    sensor =
                        { parameter = "parameter"
                        , name = "Sensor"
                        , unit = "unit"
                        , sessionCount = 1
                        }
                in
                { defaultModel
                    | selectedSensorId = Sensor.toId sensor
                    , sensors = [ sensor ]
                }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "parameter" ]
                    |> Query.has [ Slc.attribute <| value "parameter" ]
        , test "sensor filter shows sensor label based on selectedSensorId" <|
            \_ ->
                let
                    sensor =
                        { parameter = "parameter"
                        , name = "Sensor"
                        , unit = "unit"
                        , sessionCount = 1
                        }
                in
                { defaultModel
                    | selectedSensorId = Sensor.toId sensor
                    , sensors = [ sensor ]
                }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "sensor" ]
                    |> Query.has [ Slc.attribute <| value "Sensor (unit)" ]
        , test "when ShowListPopup is triggered popup is shown" <|
            \_ ->
                defaultModel
                    |> update (ShowListPopup Popup.SensorList)
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
        , fuzz string "when UpdateLocationInput is triggered new input value is visible" <|
            \locationValue ->
                defaultModel
                    |> update (UpdateLocationInput locationValue)
                    |> Tuple.first
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "location" ]
                    |> Query.has [ Slc.attribute <| value locationValue ]
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
                    |> update (ToggleCrowdMap (not onOffValue))
                    |> Tuple.first
                    |> .isCrowdMapOn
                    |> Expect.equal (not onOffValue)
        , fuzz (intRange 1 39) "UpdateCrowdMapResolution changes the value of model.crowdMapResolution" <|
            \resolution ->
                { defaultModel | crowdMapResolution = BoundedInteger.build (LowerBound 1) (UpperBound 40) (Value resolution) }
                    |> update (UpdateCrowdMapResolution (resolution + 1))
                    |> Tuple.first
                    |> .crowdMapResolution
                    |> Expect.equal (BoundedInteger.build (LowerBound 1) (UpperBound 40) (Value (resolution + 1)))
        , test "UpdateCrowdMapResolution doesn't change the value if it's higher than upper bound" <|
            \_ ->
                { defaultModel | crowdMapResolution = BoundedInteger.build (LowerBound 1) (UpperBound 40) (Value 40) }
                    |> update (UpdateCrowdMapResolution 41)
                    |> Tuple.first
                    |> .crowdMapResolution
                    |> Expect.equal (BoundedInteger.build (LowerBound 1) (UpperBound 40) (Value 40))
        , test "toggling sends ToggleCrowdMap message" <|
            \_ ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| ariaLabel "on" ]
                    |> Event.simulate Event.click
                    |> Event.expect (ToggleCrowdMap True)
        , test "slider has a description with current crowd map grid cell size" <|
            \_ ->
                { defaultModel
                    | isCrowdMapOn = True
                    , crowdMapResolution =
                        BoundedInteger.build (LowerBound 1)
                            (UpperBound 40)
                            (Value 40)
                }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| id "crowd-map-slider" ]
                    |> Query.contains
                        [ text "grid cell size: 40" ]

        -- resolution 11 maps to size 40
        , test "slider default value is 20" <|
            \_ ->
                { defaultModel | isCrowdMapOn = True }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| class "crowd-map-slider" ]
                    |> Query.has
                        [ Slc.attribute <| value "20" ]
        , fuzz int "slider value depends on model.crowdMapResolution" <|
            \resolution ->
                let
                    model =
                        { defaultModel
                            | isCrowdMapOn = True
                            , crowdMapResolution =
                                BoundedInteger.build (LowerBound 1)
                                    (UpperBound 40)
                                    (Value resolution)
                        }
                in
                model
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| class "crowd-map-slider" ]
                    |> Query.has
                        [ Slc.attribute <| value (String.fromInt resolution) ]
        , fuzz int "moving the slider updates crowd map resolution" <|
            \resolution ->
                { defaultModel | isCrowdMapOn = True }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| class "crowd-map-slider" ]
                    |> Event.simulate (Event.custom "change" <| simulatedEventObject <| String.fromInt resolution)
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
        , test "toggling triggers ToggleIndoor" <|
            \_ ->
                { defaultModel | page = Fixed }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| ariaLabel "indoor" ]
                    |> Event.simulate Event.click
                    |> Event.expect (ToggleIndoor True)
        ]


toggleStatusFilter : Test
toggleStatusFilter =
    describe "active/dormant filter tests:"
        [ test "toggle is displayed" <|
            \_ ->
                { defaultModel | page = Fixed }
                    |> view
                    |> Query.fromHtml
                    |> Expect.all
                        [ Query.has [ Slc.attribute <| ariaLabel "active" ]
                        , Query.has [ Slc.attribute <| ariaLabel "dormant" ]
                        ]
        , test "clicking dormant button triggers ToggleStatus" <|
            \_ ->
                { defaultModel | page = Fixed }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| ariaLabel "dormant" ]
                    |> Event.simulate Event.click
                    |> Event.expect (ToggleStatus Dormant)
        ]


viewTests : Test
viewTests =
    describe "view"
        [ fuzz2 string string "with no selection session titles are displayed in the list" <|
            \title1 title2 ->
                { defaultModel | sessions = [ { defaultSession | title = title1 }, { defaultSession | title = title2 } ], selectedSession = NotAsked }
                    |> view
                    |> Query.fromHtml
                    |> Query.contains
                        [ Html.text title1
                        , Html.text title2
                        ]
        , fuzz (intRange 1 100) "with no selection and fetchableSessionsCount bigger than current session list length load more button is shown" <|
            \times ->
                { defaultModel
                    | sessions = List.repeat times defaultSession
                    , fetchableSessionsCount = times + 1
                    , selectedSession = NotAsked
                }
                    |> view
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.id "more-sessions-button" ]
                    |> Query.count (Expect.equal 1)
        , fuzz (intRange 1 100) "with no selection and fetchableSessionsCount equal to current session list length load more button is not shown" <|
            \times ->
                { defaultModel
                    | sessions = List.repeat times defaultSession
                    , fetchableSessionsCount = times
                    , selectedSession = NotAsked
                }
                    |> view
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.id "more-sessions-button" ]
                    |> Query.count (Expect.equal 0)
        , test "with no selection and 0 sessions in the model the load more button is not shown" <|
            \_ ->
                { defaultModel | sessions = [], selectedSession = NotAsked }
                    |> view
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.id "more-sessions-button" ]
                    |> Query.count (Expect.equal 0)
        , test "with selection graph is shown" <|
            \_ ->
                { defaultModel | selectedSession = Success defaultSelectedSession }
                    |> view
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.id "graph" ]
                    |> Query.count (Expect.equal 1)
        , test "with selection a button to deselect session is shown" <|
            \_ ->
                { defaultModel | selectedSession = Success defaultSelectedSession }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "button", Slc.containing [ Slc.text "×" ] ]
                    |> Event.simulate Event.click
                    |> Event.expect DeselectSession
        , fuzz3 string string string "with selection the session title username and sensorName are shown" <|
            \title username sensorName ->
                let
                    selectedSession =
                        { defaultSelectedSession
                            | title = title
                            , username = username
                            , sensorName = sensorName
                        }

                    expected =
                        List.map (\x -> Slc.containing [ Slc.text x ]) [ title, username, sensorName ]
                in
                { defaultModel | selectedSession = Success selectedSession }
                    |> view
                    |> Query.fromHtml
                    |> Query.has [ Slc.all expected ]
        , fuzz string "when heatmap minimum input changes UpdateHeatMapMinimum is triggered" <|
            \min ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| id "heatmap-min" ]
                    |> Event.simulate (Event.custom "change" <| simulatedEventObject min)
                    |> Event.expect (UpdateHeatMapMinimum min)
        , fuzz string "when heatmap maximum changes UpdateHeatMapMaximum is triggered" <|
            \max ->
                defaultModel
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute <| id "heatmap-max" ]
                    |> Event.simulate (Event.custom "change" <| simulatedEventObject max)
                    |> Event.expect (UpdateHeatMapMaximum max)
        , fuzz int "heatMapThresholds threshold1 is used as a value for the heatmap minimum input" <|
            \min ->
                { defaultModel | heatMapThresholds = Success <| heatMapThresholdsWithMinimum min }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "heatmap-min" ]
                    |> Query.has [ Slc.attribute <| value <| String.fromInt min ]
        , fuzz int "heatMapThresholds threshold5 is used as a value for the heatmap maximum input" <|
            \max ->
                { defaultModel | heatMapThresholds = Success <| heatMapThresholdsWithMaximum max }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "heatmap-max" ]
                    |> Query.has [ Slc.attribute <| value <| String.fromInt max ]
        , fuzz3 string string string "heatmap minimum input unit is calculated from the selectedSensorId" <|
            \parameter name unit ->
                let
                    sensor =
                        { parameter = parameter
                        , name = name
                        , unit = unit
                        , sessionCount = 123
                        }

                    selectedSensorId =
                        Sensor.toId sensor
                in
                { defaultModel | sensors = [ sensor ], selectedSensorId = selectedSensorId }
                    |> view
                    |> Query.fromHtml
                    |> Query.has [ Slc.id "heatmap-unit-min", Slc.containing [ Slc.text unit ] ]
        , fuzz bool "search checkbox state depends on model.isSearchAsIMoveOn" <|
            \isSearchAsIMoveOn ->
                { defaultModel | isSearchAsIMoveOn = isSearchAsIMoveOn }
                    |> view
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "checkbox-search-as-i-move" ]
                    |> Query.has
                        [ Slc.attribute <| checked isSearchAsIMoveOn ]
        ]


updateTests : Test
updateTests =
    describe "update"
        [ fuzz int "UpdateSessions decodes the encoded value and replaces sessions in the model" <|
            \id ->
                let
                    model =
                        { defaultModel | sessions = [ { defaultSession | id = id } ] }

                    location =
                        { lng = 0, lat = 0 }

                    newSession =
                        { id = id + 1
                        , streamId = id + 2
                        , title = "title"
                        , startTime = Time.millisToPosix 0
                        , endTime = Time.millisToPosix 0
                        , username = "username"
                        , shortTypes = []
                        , average = Nothing
                        , location = location
                        }

                    newSessions =
                        Encode.object
                            [ ( "fetched"
                              , Encode.list identity
                                    [ Encode.object
                                        [ ( "title", Encode.string "title" )
                                        , ( "id", Encode.int <| id + 1 )
                                        , ( "streamId", Encode.int <| id + 2 )
                                        , ( "startTime", Encode.int 0 )
                                        , ( "endTime", Encode.int 0 )
                                        , ( "username", Encode.string "username" )
                                        , ( "shortTypes", Encode.list identity [] )
                                        , ( "average", Encode.null )
                                        , ( "location"
                                          , Encode.object
                                                [ ( "lng", Encode.int 0 )
                                                , ( "lat", Encode.int 0 )
                                                ]
                                          )
                                        ]
                                    ]
                              )
                            , ( "fetchableSessionsCount", Encode.int 1 )
                            ]
                in
                model
                    |> update (UpdateSessions newSessions)
                    |> Tuple.first
                    |> .sessions
                    |> Expect.equal [ newSession ]
        , fuzz int "UpdateSessions decodes the encoded value and updates model.fetchableSessionsCount" <|
            \count ->
                let
                    model =
                        { defaultModel | fetchableSessionsCount = 0 }

                    newSessions =
                        Encode.object
                            [ ( "fetched", Encode.list identity [] )
                            , ( "fetchableSessionsCount", Encode.int count )
                            ]
                in
                model
                    |> update (UpdateSessions newSessions)
                    |> Tuple.first
                    |> .fetchableSessionsCount
                    |> Expect.equal count
        , test "LoadMoreSessions delegates to javascript" <|
            \_ ->
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
                        { defaultModel | selectedSession = Success <| { defaultSelectedSession | id = id } }

                    expected =
                        { model | selectedSession = NotAsked }
                in
                model
                    |> update DeselectSession
                    |> Tuple.first
                    |> Expect.equal expected
        , fuzz int "with Nothing ToggleSessionSelectionFromJavaScript deselects the selected id" <|
            \id ->
                let
                    model =
                        { defaultModel | selectedSession = Success <| { defaultSelectedSession | id = id } }

                    expected =
                        { model | selectedSession = NotAsked }
                in
                model
                    |> update (ToggleSessionSelectionFromJavaScript Nothing)
                    |> Tuple.first
                    |> Expect.equal expected
        , test "with valid int and loaded heatMapThresholds UpdateHeatMapMinimum updates the minimum" <|
            \_ ->
                let
                    oldMin =
                        0

                    newMin =
                        -5

                    int =
                        String.fromInt newMin

                    model =
                        { defaultModel | heatMapThresholds = Success <| heatMapThresholdsWithMinimum oldMin }

                    expected =
                        { defaultModel | heatMapThresholds = Success <| heatMapThresholdsWithMinimum newMin }
                in
                model
                    |> update (UpdateHeatMapMinimum int)
                    |> Tuple.first
                    |> Expect.equal expected
        , test "with valid int and loaded heatMapThresholds UpdateHeatMapMaximum updates the maximum" <|
            \_ ->
                let
                    oldMax =
                        10

                    newMax =
                        5

                    int =
                        String.fromInt newMax

                    model =
                        { defaultModel | heatMapThresholds = Success <| heatMapThresholdsWithMaximum oldMax }

                    expected =
                        { defaultModel | heatMapThresholds = Success <| heatMapThresholdsWithMaximum newMax }
                in
                model
                    |> update (UpdateHeatMapMaximum int)
                    |> Tuple.first
                    |> Expect.equal expected
        , fuzz bool "ToggleIsSearchOn changes the state of model.isSearchAsIMoveOn" <|
            \onOrOff ->
                { defaultModel | isSearchAsIMoveOn = onOrOff }
                    |> update ToggleIsSearchOn
                    |> Tuple.first
                    |> .isSearchAsIMoveOn
                    |> Expect.equal (not onOrOff)
        ]

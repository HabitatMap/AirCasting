module Main exposing (Msg(..), defaultModel, update, view)

import Api
import Browser exposing (..)
import Browser.Dom as Dom
import Browser.Events
import Browser.Navigation
import Data.BoundedInteger as BoundedInteger exposing (BoundedInteger, LowerBound(..), UpperBound(..), Value(..))
import Data.EmailForm as EmailForm
import Data.GraphData exposing (GraphData, GraphHeatData, GraphTimeRange)
import Data.HeatMapThresholds as HeatMapThresholds exposing (HeatMapThresholdValues, HeatMapThresholds, Range(..))
import Data.Markers as Markers exposing (SessionMarkerData)
import Data.Measurements exposing (Measurement)
import Data.Overlay as Overlay exposing (Operation(..), Overlay(..), none)
import Data.Page as Page exposing (Page(..))
import Data.Path as Path exposing (Path)
import Data.SelectedSession as SelectedSession exposing (SelectedSession)
import Data.Session exposing (..)
import Data.Status as Status exposing (Status(..))
import Data.Theme as Theme exposing (Theme)
import Data.Times as Times
import Html exposing (Html, a, button, div, h2, h3, header, iframe, img, input, label, li, main_, nav, node, p, span, text, ul)
import Html.Attributes exposing (alt, attribute, autocomplete, checked, class, classList, disabled, for, href, id, max, min, name, placeholder, readonly, rel, src, target, title, type_, value)
import Html.Attributes.Aria exposing (ariaLabel, role)
import Html.Events as Events
import Html.Lazy exposing (lazy5, lazy7, lazy8)
import Http
import Json.Decode as Decode exposing (Decoder(..))
import Json.Encode as Encode
import LabelsInput
import Maybe exposing (..)
import Popup
import Ports
import Process
import RemoteData exposing (RemoteData(..), WebData)
import Sensor exposing (Sensor)
import String exposing (fromInt)
import Tagged exposing (Tagged)
import Task
import TimeRange exposing (TimeRange)
import Tooltip
import Url exposing (Url)
import Url.Builder
import Validate exposing (Valid)



---- MODEL ----


type alias Model =
    { page : Page
    , key : Maybe Browser.Navigation.Key
    , sessions : List Session
    , fetchableSessionsCount : Int
    , selectedSession : WebData SelectedSession
    , popup : Popup.Popup
    , isPopupListExpanded : Bool
    , sensors : List Sensor
    , selectedSensorId : String
    , location : String
    , tags : LabelsInput.Model
    , profiles : LabelsInput.Model
    , isCrowdMapOn : Bool
    , crowdMapResolution : BoundedInteger
    , timeRange : TimeRange
    , isIndoor : Bool
    , navLogo : Path
    , fitScaleIcon : Path
    , linkIcon : Path
    , resetIconBlack : Path
    , resetIconWhite : Path
    , themeIcons : Theme.Icons
    , tooltipIcon : Path
    , heatMapThresholds : WebData HeatMapThresholds
    , isSearchAsIMoveOn : Bool
    , wasMapMoved : Bool
    , overlay : Overlay.Model
    , scrollPosition : Float
    , debouncingCounter : Int
    , areFiltersExpanded : Bool
    , isNavExpanded : Bool
    , theme : Theme
    , status : Status
    , emailForm : EmailForm.EmailForm
    , zoomLevel : BoundedInteger
    }


defaultModel : Model
defaultModel =
    { page = Mobile
    , key = Nothing
    , sessions = []
    , fetchableSessionsCount = 0
    , popup = Popup.None
    , isPopupListExpanded = False
    , sensors = []
    , selectedSensorId = "Particulate Matter-airbeam2-pm2.5 (µg/m³)"
    , location = ""
    , tags = LabelsInput.empty
    , profiles = LabelsInput.empty
    , isCrowdMapOn = False
    , crowdMapResolution = BoundedInteger.build (LowerBound 1) (UpperBound 40) (Value 20)
    , timeRange = TimeRange.defaultTimeRange
    , isIndoor = False
    , selectedSession = NotAsked
    , navLogo = Path.empty
    , fitScaleIcon = Path.empty
    , linkIcon = Path.empty
    , resetIconBlack = Path.empty
    , resetIconWhite = Path.empty
    , themeIcons = Theme.emptyIcons
    , tooltipIcon = Path.empty
    , heatMapThresholds = NotAsked
    , isSearchAsIMoveOn = False
    , wasMapMoved = False
    , overlay = Overlay.none
    , scrollPosition = 0
    , debouncingCounter = 0
    , areFiltersExpanded = False
    , isNavExpanded = False
    , theme = Theme.default
    , status = Status.default
    , emailForm = EmailForm.defaultEmailForm
    , zoomLevel = BoundedInteger.build (LowerBound 3) (UpperBound 22) (Value 5)
    }


type alias Flags =
    { location : String
    , tags : List String
    , profiles : List String
    , isCrowdMapOn : Bool
    , crowdMapResolution : Int
    , timeRange : Encode.Value
    , isActive : Bool
    , isIndoor : Bool
    , selectedSessionId : Maybe Int
    , sensors : Encode.Value
    , selectedSensorId : String
    , navLogo : String
    , fitScaleIcon : String
    , linkIcon : String
    , resetIconBlack : String
    , resetIconWhite : String
    , themeSwitchIconBlue : String
    , themeSwitchIconDefault : String
    , tooltipIcon : String
    , heatMapThresholdValues : Maybe HeatMapThresholdValues
    , isSearchAsIMoveOn : Bool
    , scrollPosition : Float
    , theme : String
    , keepFiltersExpanded : Bool
    }


init : Flags -> Url -> Browser.Navigation.Key -> ( Model, Cmd Msg )
init flags url key =
    let
        page =
            case url.path of
                "/fixed_map" ->
                    Fixed

                _ ->
                    Mobile

        sensors =
            flags.sensors
                |> Decode.decodeValue (Decode.list Sensor.decoder)
                |> Result.withDefault []

        overlay =
            case flags.selectedSessionId of
                Nothing ->
                    Overlay.init flags.isIndoor

                Just id ->
                    Overlay.update (AddOverlay HttpingOverlay) (Overlay.init flags.isIndoor)
    in
    ( { defaultModel
        | page = page
        , key = Just key
        , location = flags.location
        , tags = LabelsInput.init flags.tags
        , profiles = LabelsInput.init flags.profiles
        , isCrowdMapOn = flags.isCrowdMapOn
        , crowdMapResolution = BoundedInteger.build (LowerBound 1) (UpperBound 40) (Value <| 51 - flags.crowdMapResolution)
        , timeRange = TimeRange.update defaultModel.timeRange flags.timeRange
        , isIndoor = flags.isIndoor
        , sensors = sensors
        , selectedSensorId = flags.selectedSensorId
        , navLogo = Path.fromString flags.navLogo
        , fitScaleIcon = Path.fromString flags.fitScaleIcon
        , linkIcon = Path.fromString flags.linkIcon
        , resetIconBlack = Path.fromString flags.resetIconBlack
        , resetIconWhite = Path.fromString flags.resetIconWhite
        , themeIcons = Theme.toIcons flags.themeSwitchIconDefault flags.themeSwitchIconBlue
        , tooltipIcon = Path.fromString flags.tooltipIcon
        , isSearchAsIMoveOn = flags.isSearchAsIMoveOn
        , overlay = overlay
        , scrollPosition = flags.scrollPosition
        , theme = Theme.toTheme flags.theme
        , status = Status.toStatus flags.isActive
        , areFiltersExpanded = flags.keepFiltersExpanded
      }
    , Cmd.batch
        [ fetchSelectedSession sensors flags.selectedSessionId flags.selectedSensorId page
        , case flags.heatMapThresholdValues of
            Nothing ->
                fetchHeatMapThresholds sensors flags.selectedSensorId

            Just values ->
                fetchHeatMapThresholdDefaults sensors flags.selectedSensorId values
        ]
    )


fetchSelectedSession : List Sensor -> Maybe Int -> String -> Page -> Cmd Msg
fetchSelectedSession sensors maybeId selectedSensorId page =
    case maybeId of
        Nothing ->
            Cmd.none

        Just id ->
            Process.sleep 500
                |> Task.perform
                    (\_ ->
                        ExecCmd (SelectedSession.fetch sensors selectedSensorId page id (RemoteData.fromResult >> GotSession))
                    )


fetchHeatMapThresholds : List Sensor -> String -> Cmd Msg
fetchHeatMapThresholds sensors selectedSensorId =
    HeatMapThresholds.fetch sensors selectedSensorId (RemoteData.fromResult >> UpdateHeatMapThresholds)
        |> Maybe.withDefault Cmd.none


fetchHeatMapThresholdDefaults : List Sensor -> String -> HeatMapThresholdValues -> Cmd Msg
fetchHeatMapThresholdDefaults sensors selectedSensorId heatMapThresholdsValues =
    HeatMapThresholds.fetchDefaults sensors selectedSensorId (RemoteData.fromResult >> UpdateHeatMapThresholds) heatMapThresholdsValues
        |> Maybe.withDefault Cmd.none



---- UPDATE ----


type Msg
    = UpdateLocationInput String
    | TagsLabels LabelsInput.Msg
    | ProfileLabels LabelsInput.Msg
    | ToggleCrowdMap Bool
    | UpdateCrowdMapResolution Int
    | UpdateZoomLevel Int
    | UpdateTimeRange Encode.Value
    | RefreshTimeRange
    | ShowCopyLinkTooltip String
    | ShowListPopup Popup.Popup
    | ShowExportPopup
    | ExportSessions (Result (List String) (Valid EmailForm.EmailForm))
    | UpdateEmailFormValue String
    | SelectSensorId String
    | ClosePopup
    | CloseEmailForm
    | TogglePopupState
    | UrlChange Url
    | UrlRequest Browser.UrlRequest
    | UpdateSessions Encode.Value
    | LoadMoreSessions
    | UpdateIsHttping Bool
    | ToggleIndoor Bool
    | ToggleStatus Status
    | DeselectSession
    | ToggleSessionSelectionFromAngular (Maybe Int)
    | SelectSession Int
    | GotSession (WebData SelectedSession)
    | GotMeasurements (WebData (List Measurement))
    | UpdateHeatMapThresholds (WebData HeatMapThresholds)
    | UpdateHeatMapMinimum String
    | UpdateHeatMapMaximum String
    | ResetHeatMapToDefaults
    | FitHeatMap
    | UpdateHeatMapThresholdsFromAngular HeatMapThresholdValues
    | ToggleIsSearchOn
    | MapMoved
    | FetchSessions
    | HighlightSessionMarker (Maybe SessionMarkerData)
    | GraphRangeSelected GraphTimeRange
    | UpdateIsShowingTimeRangeFilter Bool
    | SaveScrollPosition Float
    | SetScrollPosition
    | NoOp
    | Timeout Int
    | MaybeUpdateResolution (BoundedInteger -> BoundedInteger)
    | ToggleFiltersExpanded
    | CloseFilters
    | ToggleNavExpanded
    | ToggleTheme
    | ExecCmd (Cmd Msg)
    | SaveZoomValue Int


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UpdateLocationInput newLocation ->
            case newLocation of
                "" ->
                    ( { model | location = newLocation }, Cmd.none )

                _ ->
                    ( { model | location = newLocation }, Ports.fetchSessions () )

        TagsLabels subMsg ->
            let
                ( subModel, subCmd1 ) =
                    deselectSession model

                ( subModel2, subCmd2 ) =
                    updateLabels subMsg subModel.tags Ports.updateTags TagsLabels (\tags -> { subModel | tags = tags })
            in
            ( subModel2, Cmd.batch [ subCmd1, subCmd2 ] )

        ProfileLabels subMsg ->
            let
                ( subModel, subCmd1 ) =
                    deselectSession model

                ( subModel2, subCmd2 ) =
                    updateLabels subMsg subModel.profiles Ports.updateProfiles ProfileLabels (\profiles -> { subModel | profiles = profiles })
            in
            ( subModel2, Cmd.batch [ subCmd1, subCmd2 ] )

        ToggleCrowdMap newValue ->
            if model.isCrowdMapOn == newValue then
                ( model, Cmd.none )

            else
                ( { model | isCrowdMapOn = newValue }, Ports.toggleCrowdMap newValue )

        UpdateCrowdMapResolution resolution ->
            let
                updatedResolution =
                    BoundedInteger.setValue resolution model.crowdMapResolution
            in
            ( { model | crowdMapResolution = updatedResolution }
            , Ports.updateResolution
                (51
                    - BoundedInteger.getValue
                        updatedResolution
                )
            )

        UpdateZoomLevel zoomLevel ->
            let
                updatedInt =
                    BoundedInteger.setValue zoomLevel model.zoomLevel
            in
            ( { model | zoomLevel = updatedInt }
            , Ports.setZoom (BoundedInteger.getValue updatedInt)
            )

        SaveZoomValue zoomLevel ->
            ( { model | zoomLevel = BoundedInteger.setValue zoomLevel model.zoomLevel }, Cmd.none )

        UpdateTimeRange value ->
            let
                ( subModel, subCmd ) =
                    deselectSession model

                newTimeRange =
                    TimeRange.update subModel.timeRange value
            in
            ( { subModel | timeRange = newTimeRange }, subCmd )

        RefreshTimeRange ->
            ( model, Ports.refreshTimeRange () )

        ShowCopyLinkTooltip tooltipId ->
            ( model, Ports.showCopyLinkTooltip tooltipId )

        ShowListPopup popup ->
            ( { model | popup = popup, isPopupListExpanded = False, overlay = Overlay.update (AddOverlay PopupOverlay) model.overlay }, Cmd.none )

        ShowExportPopup ->
            ( { model | popup = Popup.EmailForm, overlay = Overlay.update (RemoveOverlay PopupOverlay) model.overlay }, Cmd.none )

        ExportSessions emailFormResult ->
            let
                toExport =
                    case model.selectedSession of
                        Success session ->
                            [ { id = session.id } ]

                        _ ->
                            List.map (\session -> { id = session.id }) model.sessions
            in
            case emailFormResult of
                Ok emailForm ->
                    ( { model | emailForm = EmailForm.addFlashMessage model.emailForm "Exported sessions will be emailed within minutes. The email may end up in your spam folder." }
                    , Cmd.batch
                        [ Http.get
                            { url = Api.exportLink (EmailForm.toEmail emailForm) toExport
                            , expect = Http.expectWhatever (\_ -> NoOp)
                            }
                        , Process.sleep 3000 |> Task.perform (always CloseEmailForm)
                        ]
                    )

                Err errors ->
                    ( { model | emailForm = EmailForm.updateErrors model.emailForm errors }, Cmd.none )

        UpdateEmailFormValue emailForm ->
            ( { model | emailForm = EmailForm.updateFormValue emailForm }, Cmd.none )

        ClosePopup ->
            ( { model | popup = Popup.None, overlay = Overlay.update (RemoveOverlay PopupOverlay) model.overlay }, Cmd.none )

        CloseEmailForm ->
            ( { model | popup = Popup.None, emailForm = EmailForm.clearFlash model.emailForm }, Cmd.none )

        TogglePopupState ->
            ( { model | isPopupListExpanded = not model.isPopupListExpanded }, Cmd.none )

        SelectSensorId value ->
            let
                ( subModel, subCmd ) =
                    deselectSession model

                selectedSensorId =
                    Sensor.idForParameterOrLabel value subModel.selectedSensorId subModel.sensors
            in
            ( { subModel | selectedSensorId = selectedSensorId }
            , Cmd.batch
                [ Ports.selectSensorId selectedSensorId
                , fetchHeatMapThresholds subModel.sensors selectedSensorId
                , subCmd
                ]
            )

        UrlChange url ->
            case model.key of
                Just key ->
                    ( model, Cmd.none )

                Nothing ->
                    ( model, Cmd.none )

        UrlRequest urlRequest ->
            case urlRequest of
                Internal url ->
                    case model.key of
                        Just key ->
                            ( model, Browser.Navigation.load (Url.toString url) )

                        Nothing ->
                            -- This should never happen. The key should be Nothing only in tests.
                            ( model, Cmd.none )

                External url ->
                    ( model, Browser.Navigation.load url )

        UpdateSessions value ->
            let
                decoder =
                    Decode.map2 Tuple.pair
                        (Decode.field "fetched" (Decode.list Data.Session.decoder))
                        (Decode.field "fetchableSessionsCount" Decode.int)

                ( fetched, fetchableSessionsCount ) =
                    Decode.decodeValue decoder value
                        |> Result.withDefault ( [], 0 )
            in
            ( { model | sessions = fetched, fetchableSessionsCount = fetchableSessionsCount, wasMapMoved = False }
            , Cmd.none
            )

        LoadMoreSessions ->
            ( model, Ports.loadMoreSessions () )

        UpdateIsHttping isHttpingNow ->
            let
                overlay =
                    if isHttpingNow then
                        AddOverlay HttpingOverlay

                    else
                        RemoveOverlay HttpingOverlay
            in
            ( { model | overlay = Overlay.update overlay model.overlay }, Cmd.none )

        ToggleIndoor newValue ->
            let
                ( subModel, subCmd ) =
                    deselectSession model
            in
            if subModel.isIndoor == newValue then
                ( model, Cmd.none )

            else if newValue then
                ( { subModel | isIndoor = True, profiles = LabelsInput.empty, overlay = Overlay.update (AddOverlay IndoorOverlay) model.overlay }
                , Cmd.batch [ Ports.toggleIndoor True, Ports.updateProfiles [], subCmd ]
                )

            else
                ( { subModel | isIndoor = False, overlay = Overlay.update (RemoveOverlay IndoorOverlay) model.overlay }
                , Cmd.batch [ Ports.toggleIndoor False, subCmd ]
                )

        ToggleStatus newStatus ->
            let
                ( subModel, subCmd ) =
                    deselectSession model
            in
            if subModel.status == newStatus then
                ( model, Cmd.none )

            else
                ( { subModel | status = newStatus }
                , Cmd.batch [ Ports.toggleActive (Status.toBool newStatus), subCmd ]
                )

        DeselectSession ->
            deselectSession model

        ToggleSessionSelectionFromAngular maybeId ->
            case ( model.selectedSession, maybeId ) of
                ( Success session, Just id ) ->
                    if SelectedSession.toId session == id then
                        deselectSession model

                    else
                        let
                            ( subModel, subCmd ) =
                                deselectSession model
                        in
                        ( { subModel | overlay = Overlay.update (AddOverlay HttpingOverlay) model.overlay }
                        , Cmd.batch
                            [ SelectedSession.fetch model.sensors model.selectedSensorId model.page id (RemoteData.fromResult >> GotSession)
                            , getScrollPosition
                            , subCmd
                            ]
                        )

                ( _, Just id ) ->
                    ( { model | overlay = Overlay.update (AddOverlay HttpingOverlay) model.overlay }
                    , Cmd.batch
                        [ SelectedSession.fetch model.sensors model.selectedSensorId model.page id (RemoteData.fromResult >> GotSession)
                        , getScrollPosition
                        ]
                    )

                ( _, Nothing ) ->
                    ( { model | selectedSession = NotAsked }, Cmd.none )

        SelectSession id ->
            case model.selectedSession of
                NotAsked ->
                    ( { model | overlay = Overlay.update (AddOverlay HttpingOverlay) model.overlay }
                    , Cmd.batch
                        [ SelectedSession.fetch model.sensors model.selectedSensorId model.page id (RemoteData.fromResult >> GotSession)
                        , Ports.pulseSessionMarker Nothing
                        , getScrollPosition
                        ]
                    )

                _ ->
                    ( model, Cmd.none )

        SaveScrollPosition position ->
            ( { model | scrollPosition = position }, Ports.saveScrollPosition position )

        GotSession response ->
            case ( model.heatMapThresholds, response ) of
                ( Success thresholds, Success selectedSession ) ->
                    let
                        newSession =
                            SelectedSession.updateFetchedTimeRange selectedSession
                    in
                    ( { model | selectedSession = Success newSession, overlay = Overlay.update (RemoveOverlay HttpingOverlay) model.overlay }
                    , Cmd.batch
                        [ graphDrawCmd thresholds newSession model.sensors model.selectedSensorId model.page
                        , Ports.selectSession (SelectedSession.formatForAngular newSession)
                        ]
                    )

                _ ->
                    ( { model | selectedSession = response, overlay = Overlay.update (RemoveOverlay HttpingOverlay) model.overlay }, Cmd.none )

        GotMeasurements response ->
            case ( model.heatMapThresholds, model.selectedSession, response ) of
                ( Success thresholds, Success session, Success measurements ) ->
                    let
                        updatedSession =
                            SelectedSession.updateMeasurements measurements session
                    in
                    ( { model | selectedSession = Success updatedSession }
                    , Ports.updateGraphData
                        { measurements = updatedSession.measurements
                        , times = SelectedSession.times updatedSession
                        }
                    )

                _ ->
                    ( model, Cmd.none )

        UpdateHeatMapThresholds heatMapThresholds ->
            let
                cmd =
                    case heatMapThresholds of
                        Success thresholds ->
                            Ports.updateHeatMapThresholds <| HeatMapThresholds.toValues thresholds

                        _ ->
                            Cmd.none
            in
            ( { model | heatMapThresholds = heatMapThresholds }, cmd )

        UpdateHeatMapMinimum value ->
            updateHeatMapExtreme model value HeatMapThresholds.updateMinimum

        UpdateHeatMapMaximum value ->
            updateHeatMapExtreme model value HeatMapThresholds.updateMaximum

        ResetHeatMapToDefaults ->
            case model.heatMapThresholds of
                Success thresholds ->
                    let
                        newThresholds =
                            HeatMapThresholds.toDefaults thresholds
                    in
                    ( { model | heatMapThresholds = Success newThresholds }
                    , Ports.updateHeatMapThresholds <| HeatMapThresholds.toValues newThresholds
                    )

                _ ->
                    ( model, Cmd.none )

        FitHeatMap ->
            case ( model.heatMapThresholds, model.selectedSession ) of
                ( Success thresholds, Success session ) ->
                    let
                        newThresholds =
                            HeatMapThresholds.fitThresholds (SelectedSession.measurementBounds session) thresholds
                    in
                    ( { model | heatMapThresholds = Success newThresholds }
                    , Ports.updateHeatMapThresholds <| HeatMapThresholds.toValues newThresholds
                    )

                _ ->
                    ( model, Cmd.none )

        UpdateHeatMapThresholdsFromAngular values ->
            let
                updateThresholdsInModel thresholds =
                    { model | heatMapThresholds = Success <| HeatMapThresholds.updateFromValues values thresholds }

                updateThresholdsCmd thresholds =
                    if values /= HeatMapThresholds.toValues thresholds then
                        Ports.updateHeatMapThresholds values

                    else
                        Cmd.none
            in
            case ( model.heatMapThresholds, model.selectedSession ) of
                ( Success thresholds, Success session ) ->
                    ( updateThresholdsInModel thresholds
                    , Cmd.batch
                        [ updateThresholdsCmd thresholds
                        , Ports.updateGraphYAxis <| toGraphHeatParams (HeatMapThresholds.updateFromValues values thresholds)
                        ]
                    )

                ( Success thresholds, _ ) ->
                    ( updateThresholdsInModel thresholds
                    , updateThresholdsCmd thresholds
                    )

                _ ->
                    ( model, Cmd.none )

        ToggleIsSearchOn ->
            ( { model | isSearchAsIMoveOn = not model.isSearchAsIMoveOn }, Ports.toggleIsSearchOn (not model.isSearchAsIMoveOn) )

        MapMoved ->
            ( { model | wasMapMoved = True }, Cmd.none )

        FetchSessions ->
            ( model, Ports.fetchSessions () )

        HighlightSessionMarker sessionMarkerData ->
            ( model
            , Ports.pulseSessionMarker <| sessionMarkerData
            )

        GraphRangeSelected times ->
            case model.selectedSession of
                Success session ->
                    let
                        newSession =
                            { session | selectedTimeRange = times }
                    in
                    ( { model | selectedSession = Success newSession }
                    , SelectedSession.fetchMeasurements newSession (RemoteData.fromResult >> GotMeasurements) Ports.updateGraphData
                    )

                _ ->
                    ( model, Cmd.none )

        UpdateIsShowingTimeRangeFilter isShown ->
            let
                overlay =
                    if isShown then
                        AddOverlay TimeFrameOverlay

                    else
                        RemoveOverlay TimeFrameOverlay
            in
            ( { model | overlay = Overlay.update overlay model.overlay }, Cmd.none )

        SetScrollPosition ->
            ( model, setScrollPosition model.scrollPosition )

        NoOp ->
            ( model, Cmd.none )

        Timeout int ->
            if int == model.debouncingCounter then
                ( { model | debouncingCounter = 0 }, Ports.updateResolution (51 - BoundedInteger.getValue model.crowdMapResolution) )

            else
                ( model, Cmd.none )

        MaybeUpdateResolution updateResolution ->
            debounce updateResolution model

        ToggleFiltersExpanded ->
            ( { model | areFiltersExpanded = not model.areFiltersExpanded, isNavExpanded = False }, Ports.updateParams { key = "keepFiltersExpanded", value = False } )

        CloseFilters ->
            ( { model | areFiltersExpanded = False }, Ports.updateParams { key = "keepFiltersExpanded", value = False } )

        ToggleNavExpanded ->
            ( { model | isNavExpanded = not model.isNavExpanded, areFiltersExpanded = False }, Cmd.none )

        ToggleTheme ->
            let
                newTheme =
                    Theme.toggle model.theme
            in
            ( { model | theme = newTheme }, Ports.toggleTheme (Theme.toString newTheme) )

        ExecCmd cmd ->
            ( model, cmd )


type alias Debouncable a =
    { a | debouncingCounter : Int, crowdMapResolution : BoundedInteger }


debounce : (BoundedInteger -> BoundedInteger) -> Debouncable a -> ( Debouncable a, Cmd Msg )
debounce updateResolution debouncable =
    let
        newCounter =
            debouncable.debouncingCounter + 1
    in
    ( { debouncable | crowdMapResolution = updateResolution debouncable.crowdMapResolution, debouncingCounter = newCounter }
    , Process.sleep 1000 |> Task.perform (\_ -> Timeout newCounter)
    )


updateHeatMapExtreme : Model -> String -> (Int -> HeatMapThresholds -> HeatMapThresholds) -> ( Model, Cmd Msg )
updateHeatMapExtreme model str updateExtreme =
    case ( String.toInt str, model.heatMapThresholds ) of
        ( Just i, Success thresholds ) ->
            ( { model | heatMapThresholds = Success <| updateExtreme i thresholds }
            , Ports.updateHeatMapThresholds <| HeatMapThresholds.toValues <| updateExtreme i thresholds
            )

        ( _, _ ) ->
            ( model, Cmd.none )


updateLabels :
    LabelsInput.Msg
    -> LabelsInput.Model
    -> (List String -> Cmd LabelsInput.Msg)
    -> (LabelsInput.Msg -> Msg)
    -> (LabelsInput.Model -> Model)
    -> ( Model, Cmd Msg )
updateLabels msg model toSubCmd mapper updateModel =
    let
        ( subModel, subCmd ) =
            LabelsInput.update msg model toSubCmd
    in
    ( updateModel subModel, Cmd.map mapper subCmd )


graphDrawCmd : HeatMapThresholds -> SelectedSession -> List Sensor -> String -> Page -> Cmd Msg
graphDrawCmd thresholds session sensors selectedSensorId page =
    let
        params =
            toGraphParams thresholds session sensors selectedSensorId
    in
    case page of
        Mobile ->
            Ports.drawMobile params

        Fixed ->
            Ports.drawFixed params


toGraphParams : HeatMapThresholds -> SelectedSession -> List Sensor -> String -> GraphData
toGraphParams thresholds selectedSession sensors selectedSensorId =
    let
        parameter =
            Sensor.parameterForId sensors selectedSensorId

        unit =
            Sensor.unitForSensorId selectedSensorId sensors |> Maybe.withDefault ""
    in
    { sensor = { parameter = parameter, unit = unit }
    , heat = toGraphHeatParams thresholds
    , times = SelectedSession.times selectedSession
    , measurements = selectedSession.measurements
    }


toGraphHeatParams : HeatMapThresholds -> GraphHeatData
toGraphHeatParams thresholds =
    let
        { threshold1, threshold2, threshold3, threshold4, threshold5 } =
            HeatMapThresholds.toValues thresholds

        levels =
            [ { from = threshold1, to = threshold2, className = "first-band" }
            , { from = threshold2, to = threshold3, className = "second-band" }
            , { from = threshold3, to = threshold4, className = "third-band" }
            , { from = threshold4, to = threshold5, className = "fourth-band" }
            ]
    in
    { threshold1 = threshold1, threshold5 = threshold5, levels = levels }


type alias Selectable a =
    { a | selectedSession : WebData SelectedSession, scrollPosition : Float }


deselectSession : Selectable a -> ( Selectable a, Cmd Msg )
deselectSession selectable =
    case selectable.selectedSession of
        Success selectedSession ->
            ( { selectable | selectedSession = NotAsked }
            , Cmd.batch
                [ Ports.deselectSession ()
                , Ports.observeSessionsList ()
                ]
            )

        _ ->
            ( selectable, Cmd.none )


getScrollPosition : Cmd Msg
getScrollPosition =
    Dom.getViewportOf "session-cards-container"
        |> Task.attempt
            (\result ->
                result
                    |> Result.map (\viewport -> viewport.viewport.x)
                    |> Result.withDefault 0
                    |> SaveScrollPosition
            )


setScrollPosition : Float -> Cmd Msg
setScrollPosition value =
    Dom.setViewportOf "session-cards-container" value 0 |> Task.attempt (\_ -> NoOp)



---- VIEW ----


viewDocument2 : Model -> Browser.Document Msg
viewDocument2 model =
    { title = "AirCasting"
    , body =
        [ snippetGoogleTagManager
        , view model
        ]
    }


viewDocument : Model -> Browser.Document Msg
viewDocument model =
    { title = "AirCasting"
    , body =
        [ snippetGoogleTagManager
        , lazy5 viewNav model.navLogo model.isNavExpanded model.sensors model.selectedSensorId model.page
        , view model
        ]
    }


view2 : Model -> Html Msg
view2 model =
    div [ id "elm-app", class (Theme.toString model.theme) ]
        [ lazy5 viewNav2 model.navLogo model.isNavExpanded model.sensors model.selectedSensorId model.page
        , viewMain model
        ]


view : Model -> Html Msg
view model =
    div [ id "elm-app", class (Theme.toString model.theme) ]
        [ viewMain model
        ]


snippetGoogleTagManager =
    node "noscript"
        []
        [ iframe
            [ attribute "height" "0"
            , src "https://www.googletagmanager.com/ns.html?id=GTM-T948MNX"
            , attribute "style" "display:none;visibility:hidden"
            , attribute "width" "0"
            ]
            []
        ]


viewNav : Path -> Bool -> List Sensor -> String -> Page -> Html Msg
viewNav navLogo isNavExpanded sensors selectedSensorId page =
    header [ class "header", id "js-header" ]
        [ div [ class "header__brand" ]
            [ div [ class "logo header__logo" ]
                [ a [ href "/" ]
                    [ Html.node "svg"
                        [ class "logo--hm", attribute "enable-background" "new 0 0 130 56", attribute "viewbox" "0 0 130 56", attribute "xmlns" "http://www.w3.org/2000/svg", attribute "xmlns:xlink" "http://www.w3.org/1999/xlink" ]
                        [ node "mask"
                            [ attribute "height" "21", id "a", attribute "maskUnits" "userSpaceOnUse", attribute "width" "4.5", attribute "x" "86.3", attribute "y" ".4" ]
                            [ Html.node "path"
                                [ attribute "clip-rule" "evenodd", attribute "d" "m0 55.1h129.9v-54.7h-129.9z", attribute "fill" "#fff", attribute "fill-rule" "evenodd" ]
                                []
                            ]
                        , node "mask"
                            [ attribute "height" "18.8", id "b", attribute "maskUnits" "userSpaceOnUse", attribute "width" "10.6", attribute "x" "92.5", attribute "y" "2.8" ]
                            [ Html.node "path"
                                [ attribute "clip-rule" "evenodd", attribute "d" "m0 55.1h129.9v-54.7h-129.9z", attribute "fill" "#fff", attribute "fill-rule" "evenodd" ]
                                []
                            ]
                        , node "mask"
                            [ attribute "height" "15.2", id "c", attribute "maskUnits" "userSpaceOnUse", attribute "width" "14.4", attribute "x" "104.5", attribute "y" "6.5" ]
                            [ Html.node "path"
                                [ attribute "clip-rule" "evenodd", attribute "d" "m0 55.1h129.9v-54.7h-129.9z", attribute "fill" "#fff", attribute "fill-rule" "evenodd" ]
                                []
                            ]
                        , node "mask"
                            [ attribute "height" "18.8", id "d", attribute "maskUnits" "userSpaceOnUse", attribute "width" "10.6", attribute "x" "119.3", attribute "y" "2.8" ]
                            [ Html.node "path"
                                [ attribute "clip-rule" "evenodd", attribute "d" "m0 55.1h129.9v-54.7h-129.9z", attribute "fill" "#fff", attribute "fill-rule" "evenodd" ]
                                []
                            ]
                        , node "mask"
                            [ attribute "height" "20.4", id "e", attribute "maskUnits" "userSpaceOnUse", attribute "width" "21.9", attribute "x" "33.7", attribute "y" "28.9" ]
                            [ Html.node "path"
                                [ attribute "clip-rule" "evenodd", attribute "d" "m0 55.1h129.9v-54.7h-129.9z", attribute "fill" "#fff", attribute "fill-rule" "evenodd" ]
                                []
                            ]
                        , node "mask"
                            [ attribute "height" "15.2", id "f", attribute "maskUnits" "userSpaceOnUse", attribute "width" "14.4", attribute "x" "58.5", attribute "y" "34.4" ]
                            [ Html.node "path"
                                [ attribute "clip-rule" "evenodd", attribute "d" "m0 55.1h129.9v-54.7h-129.9z", attribute "fill" "#fff", attribute "fill-rule" "evenodd" ]
                                []
                            ]
                        , node "mask"
                            [ attribute "height" "20.7", id "g", attribute "maskUnits" "userSpaceOnUse", attribute "width" "14.7", attribute "x" "75", attribute "y" "34.4" ]
                            [ Html.node "path"
                                [ attribute "clip-rule" "evenodd", attribute "d" "m0 55.1h129.9v-54.7h-129.9z", attribute "fill" "#fff", attribute "fill-rule" "evenodd" ]
                                []
                            ]
                        , node "mask"
                            [ attribute "height" "29.8", id "h", attribute "maskUnits" "userSpaceOnUse", attribute "width" "20.5", attribute "x" "0", attribute "y" "19.4" ]
                            [ Html.node "path"
                                [ attribute "clip-rule" "evenodd", attribute "d" "m0 55.1h129.9v-54.7h-129.9z", attribute "fill" "#fff", attribute "fill-rule" "evenodd" ]
                                []
                            ]
                        , Html.node "g"
                            [ attribute "clip-rule" "evenodd", attribute "fill-rule" "evenodd" ]
                            [ Html.node "path"
                                [ attribute "d" "m49 1v20h-3.5v-8.4h-7.9v8.4h-3.6v-20h3.5v8.2h7.9v-8.2z" ]
                                []
                            , Html.node "path"
                                [ attribute "d" "m62.1 15.1-3.2.3c-1.3.1-2.3.7-2.3 1.8 0 1.2.9 1.6 2.1 1.6 1.6 0 3.5-.8 3.5-3.1v-.6zm5.1 3.5v2.8h-1.6c-1.4 0-2.4-.4-2.9-1.7-1 1.3-2.5 2-4.8 2-2.9 0-5.1-1.4-5.1-4.3 0-2.8 2.1-4.2 4.8-4.4l4.5-.5v-.6c0-1.6-1-2.4-2.4-2.4-1.6 0-2.4.9-2.6 2.2h-3.7c.3-3 2.6-5.2 6.3-5.2 3.4 0 6.1 1.7 6.1 5.6v5.3c0 .8.3 1.1 1 1.1z" ]
                                []
                            , Html.node "path"
                                [ attribute "d" "m80.3 14.1c0-2.6-1.5-4.3-3.7-4.3s-3.6 1.7-3.6 4.3 1.4 4.4 3.6 4.4c2.2-.1 3.7-1.8 3.7-4.4m3.7 0c0 4.6-2.9 7.6-6.8 7.6-2.3 0-3.6-1.1-4.3-2h-.3l-.3 1.7h-3v-20.7h3.7v7.5c.8-.9 2.2-1.7 4.2-1.7 3.8 0 6.8 2.8 6.8 7.6" ]
                                []
                            , Html.node "path"
                                [ attribute "d" "m86.8 21.4h3.7v-14.6h-3.7zm-.5-18.7c0-1.3 1.1-2.3 2.3-2.3s2.2 1 2.2 2.3c0 1.2-1 2.2-2.2 2.2s-2.3-1-2.3-2.2z", attribute "mask" "url(#a)" ]
                                []
                            , Html.node "path"
                                [ attribute "d" "m95.6 17.4v-7.6h-3.1v-3h1c1.8 0 2.5-.6 2.5-2.2v-1.8h3.4v4h3.8v2.9h-3.8v7.2c0 .8.2 1.8 1.9 1.8.4 0 1-.1 1.4-.2v2.8c-.6.1-1.5.3-2.5.3-4.1.1-4.6-2.6-4.6-4.2", attribute "mask" "url(#b)" ]
                                []
                            , Html.node "path"
                                [ attribute "d" "m113.8 15.1-3.2.3c-1.3.1-2.3.7-2.3 1.8 0 1.2.9 1.6 2.1 1.6 1.6 0 3.5-.8 3.5-3.1v-.6zm5.1 3.5v2.8h-1.6c-1.4 0-2.4-.4-2.9-1.7-1 1.3-2.5 2-4.8 2-2.9 0-5.1-1.4-5.1-4.3 0-2.8 2.1-4.2 4.8-4.4l4.5-.5v-.6c0-1.6-1-2.4-2.4-2.4-1.6 0-2.4.9-2.6 2.2h-3.7c.3-3 2.6-5.2 6.3-5.2 3.4 0 6.1 1.7 6.1 5.6v5.3c0 .8.3 1.1 1 1.1z", attribute "mask" "url(#c)" ]
                                []
                            , Html.node "path"
                                [ attribute "d" "m122.4 17.4v-7.6h-3.1v-3h1c1.8 0 2.5-.6 2.5-2.2v-1.8h3.4v4h3.8v2.9h-3.8v7.2c0 .8.2 1.8 1.9 1.8.4 0 1-.1 1.4-.2v2.8c-.6.1-1.5.3-2.5.3-4.1.1-4.6-2.6-4.6-4.2", attribute "mask" "url(#d)" ]
                                []
                            , Html.node "path"
                                [ attribute "d" "m55.6 49.3h-3.7v-13.6h-.2l-5 11.2h-3.8l-5.1-11.2h-.2v13.6h-3.7v-20.4h4.7l6.2 14h.2l6.1-14h4.7z", attribute "mask" "url(#e)" ]
                                []
                            , Html.node "path"
                                [ attribute "d" "m67.8 42.9-3.2.3c-1.3.1-2.3.7-2.3 1.8 0 1.2.9 1.6 2.1 1.6 1.6 0 3.5-.8 3.5-3.1v-.6zm5.1 3.6v2.8h-1.6c-1.4 0-2.4-.4-2.9-1.7-1 1.3-2.5 2-4.8 2-2.9 0-5.1-1.4-5.1-4.3 0-2.8 2.1-4.2 4.8-4.4l4.5-.5v-.6c0-1.6-1-2.4-2.4-2.4-1.6 0-2.4.9-2.6 2.2h-3.7c.3-3 2.6-5.2 6.3-5.2 3.4 0 6.1 1.7 6.1 5.6v5.3c0 .8.3 1.1 1 1.1z", attribute "mask" "url(#f)" ]
                                []
                            , Html.node "path"
                                [ attribute "d" "m86 42c0-2.6-1.5-4.4-3.7-4.4s-3.6 1.7-3.6 4.4c0 2.6 1.4 4.3 3.6 4.3s3.7-1.7 3.7-4.3m3.7 0c0 4.8-3 7.5-6.8 7.5-2 0-3.4-.8-4.2-1.7v7.2h-3.7v-20.3h3l.3 1.7h.3c.7-.9 2.1-2 4.3-2 3.9 0 6.8 3 6.8 7.6", attribute "mask" "url(#g)" ]
                                []
                            , Html.node "path"
                                [ attribute "d" "m12.3 27.8c-3.1 0-4.9 1.3-6.1 2.9h-.3v-11.3h-5.9v29.8h5.9 4.8l-4.1-7.5c-.5-.8-.7-1.7-.7-2.7 0-2.7 2.2-4.9 4.9-4.9s4.9 2.2 4.9 4.9c0 1-.3 1.9-.8 2.7l-4.1 7.5h4.4 5.3v-12.8c0-5.5-3.2-8.6-8.2-8.6", attribute "mask" "url(#h)" ]
                                []
                            ]
                        ]
                    , Html.node "svg"
                        [ class "logo--hm-monogram", attribute "enable-background" "new 0 0 21 31", attribute "viewbox" "0 0 21 31", attribute "xmlns" "http://www.w3.org/2000/svg" ]
                        [ Html.node "path"
                            [ attribute "clip-rule" "evenodd", attribute "d" "m12.3 8.8c-3.1 0-4.9 1.3-6.1 2.9h-.3v-11.3h-5.9v29.8h5.9 4.8l-4.1-7.5c-.5-.8-.7-1.7-.7-2.7 0-2.7 2.2-4.9 4.9-4.9s4.9 2.2 4.9 4.9c0 1-.3 1.9-.8 2.7l-4.1 7.5h4.4 5.3v-12.8c0-5.5-3.2-8.6-8.2-8.6", attribute "fill-rule" "evenodd" ]
                            []
                        ]
                    ]
                ]
            , button [ class "header__nav-toggle-button js--toggle-nav" ]
                [ Html.node "svg"
                    [ class "icon-nav-open", attribute "height" "21", attribute "viewbox" "0 0 25 21", attribute "width" "25", attribute "xmlns" "http://www.w3.org/2000/svg" ]
                    [ Html.node "g"
                        [ attribute "fill" "none", attribute "fill-rule" "evenodd", attribute "stroke-linecap" "square", attribute "stroke-width" "2", attribute "transform" "translate(1)" ]
                        [ Html.node "path"
                            [ attribute "d" "m23 1h-22.73035714" ]
                            []
                        , Html.node "path"
                            [ attribute "d" "m23 10.5h-22.73035714" ]
                            []
                        , Html.node "path"
                            [ attribute "d" "m23 20h-22.73035714" ]
                            []
                        ]
                    ]
                , Html.node "svg"
                    [ class "icon-nav-close", attribute "height" "20", attribute "viewbox" "0 0 20 20", attribute "width" "20", attribute "xmlns" "http://www.w3.org/2000/svg" ]
                    [ Html.node "g"
                        [ attribute "fill" "none", attribute "fill-rule" "evenodd", attribute "stroke" "#fff", attribute "stroke-linecap" "square", attribute "stroke-width" "2", attribute "transform" "translate(.865179 1)" ]
                        [ Html.node "path"
                            [ attribute "d" "m21 9h-22.73035714", attribute "transform" "matrix(-.70710678 .70710678 -.70710678 -.70710678 22.581475 8.646447)" ]
                            []
                        , Html.node "path"
                            [ attribute "d" "m21.1348214 8.5h-22.73035711", attribute "transform" "matrix(.70710678 .70710678 -.70710678 .70710678 8.832381 -4.323255)" ]
                            []
                        ]
                    ]
                ]
            ]
        , nav [ class "nav" ]
            [ div [ class "nav-main" ]
                [ ul [ class "nav-list" ]
                    [ li [ class "nav-list__element" ]
                        [ a [ class "nav-list__link", href "/airbeam" ]
                            [ text "AirBeam" ]
                        , ul [ class "subnav-list" ]
                            [ li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href "/airbeam/how-it-works" ]
                                    [ text "How it Works" ]
                                ]
                            , li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href "/airbeam/FAQ" ]
                                    [ text "FAQ" ]
                                ]
                            , li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href "/airbeam/users-guide" ]
                                    [ text "User's Guide" ]
                                ]
                            , li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href "/airbeam/buy-it-now" ]
                                    [ text "Buy it Now" ]
                                ]
                            ]
                        ]
                    , li [ class "nav-list__element" ]
                        [ a [ class "nav-list__link", attribute "data-current" "current page", href "/aircasting" ]
                            [ text "AirCasting" ]
                        , ul [ class "subnav-list" ]
                            [ li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href "https://play.google.com/store/apps/details?id=pl.llp.aircasting&hl=en_US" ]
                                    [ text "Aircasting App" ]
                                ]
                            ]
                        ]
                    , li [ class "nav-list__element" ]
                        [ a [ class "nav-list__link", href "/about" ]
                            [ text "About Habitatmap" ]
                        , ul [ class "subnav-list" ]
                            [ li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href "/about/history" ]
                                    [ text "History & People" ]
                                ]
                            ]
                        ]
                    , li [ class "nav-list__element" ]
                        [ a [ class "nav-list__link", href "/blog" ]
                            [ text "TakingSpace Blog" ]
                        ]
                    ]
                ]
            , div [ class "nav-sub" ]
                [ a [ class "nav-list__link nav-list__link--search", href "/search" ]
                    [ Html.node "svg"
                        [ class "js--search-open icon-search", attribute "height" "38", attribute "viewbox" "0 0 35 38", attribute "width" "35", attribute "xmlns" "http://www.w3.org/2000/svg" ]
                        [ Html.node "path"
                            [ attribute "d" "m18.7141827 21.4071377-15.7141827 15.7141826-2.12132034-2.1213203 15.29482644-15.2948264c-2.2543839-2.0143638-3.6735061-4.9440418-3.6735061-8.2051736 0-6.07513225 4.9248678-11 11-11s11 4.92486775 11 11c0 6.0751322-4.9248678 11-11 11-1.7152911 0-3.3388837-.3926076-4.7858173-1.0928623zm4.7858173-1.9071377c4.418278 0 8-3.581722 8-8s-3.581722-8-8-8-8 3.581722-8 8 3.581722 8 8 8z" ]
                            []
                        ]
                    ]
                , a [ class "nav-list__link nav-list__link--donate u--capitalized", href "/donate" ]
                    [ text "Donate" ]
                , a [ class "button button--small header__button", href "/airbeam/buy-it-now" ]
                    [ text "Get Airbeam" ]
                ]
            ]
        ]


viewNav2 : Path -> Bool -> List Sensor -> String -> Page -> Html Msg
viewNav2 navLogo isNavExpanded sensors selectedSensorId page =
    header
        [ classList [ ( "menu-collapsed", not isNavExpanded ) ]
        ]
        [ div
            [ class "filters-info u--show-on-mobile"
            , Events.onClick ToggleFiltersExpanded
            ]
            [ p
                [ class "filters-info__session-type" ]
                [ text (Page.toString page)
                , text " sessions"
                ]
            , p []
                [ text (Sensor.parameterForId sensors selectedSensorId)
                , text " - "
                , text (Sensor.sensorLabelForId sensors selectedSensorId)
                ]
            ]
        , div [ class "logo" ]
            [ a
                [ ariaLabel "Homepage"
                , href "/"
                ]
                [ img [ src (Path.toString navLogo), alt "Aircasting Logo" ] []
                ]
            ]
        , nav
            [ class "nav"
            , id "menu"
            , role "navigation"
            ]
            [ ul []
                [ li []
                    [ a [ class "nav__link", href "/" ]
                        [ text "Home" ]
                    ]
                , li []
                    [ a [ class "nav__link", href "/about" ]
                        [ text "About" ]
                    ]
                , li [ class "active" ]
                    [ a [ class "nav__link", href "/map" ]
                        [ text "Maps" ]
                    ]
                , li []
                    [ a [ class "nav__link", href "http://www.takingspace.org/", rel "noreferrer", target "_blank" ]
                        [ text "Blog" ]
                    ]
                , li []
                    [ a [ class "nav__link", href "/donate" ]
                        [ text "Donate" ]
                    ]
                ]
            ]
        , button
            [ class "nav__menu-button nav__menu-button--filter"
            , title "Filters"
            , type_ "button"
            , ariaLabel "Filters"
            , Events.onClick ToggleFiltersExpanded
            ]
            []
        , button
            [ class "nav__menu-button nav__menu-button--hamburger"
            , title "Menu"
            , type_ "button"
            , ariaLabel "Menu"
            , Events.onClick ToggleNavExpanded
            ]
            []
        ]


viewMain : Model -> Html Msg
viewMain model =
    main_
        []
        [ div [ class "maps-page-container" ]
            [ div
                [ classList
                    [ ( "filters", True )
                    , ( "filters--collapsed", not model.areFiltersExpanded )
                    ]
                ]
                [ viewSessionTypeNav model
                , viewFilters model
                , viewFiltersButtons model.selectedSession model.sessions model.linkIcon model.popup model.emailForm
                , button
                    [ class "show-results-button"
                    , Events.onClick CloseFilters
                    ]
                    [ text "show results" ]
                ]
            , viewMap model
            ]
        ]


viewMap : Model -> Html Msg
viewMap model =
    div [ class "maps-content-container" ]
        [ Overlay.view model.overlay
        , div [ class "map-container" ]
            [ viewSearchAsIMove model
            , viewZoomSlider model.zoomLevel
            , div [ class "map", id "map11", attribute "ng-controller" "MapCtrl", attribute "googlemap" "" ]
                []
            , lazy8 viewSessionsOrSelectedSession model.page model.selectedSession model.fetchableSessionsCount model.sessions model.heatMapThresholds model.linkIcon model.popup model.emailForm
            ]
        , lazy7
            viewHeatMap
            model.heatMapThresholds
            (Sensor.unitForSensorId model.selectedSensorId model.sensors |> Maybe.withDefault "")
            model.fitScaleIcon
            model.resetIconBlack
            model.themeIcons
            model.theme
            model.selectedSession
        ]


viewZoomSlider : BoundedInteger -> Html Msg
viewZoomSlider boundedInteger =
    let
        updateOnClick : (BoundedInteger -> BoundedInteger) -> Msg
        updateOnClick updateValue =
            boundedInteger
                |> updateValue
                |> BoundedInteger.getValue
                |> UpdateZoomLevel
    in
    div [ class "zoom-slider-container" ]
        [ span
            [ class "zoom__plus"
            , Events.onClick (updateOnClick BoundedInteger.addOne)
            ]
            [ text "+" ]
        , input
            [ class "zoom-slider"
            , onChange (String.toInt >> Maybe.withDefault 25 >> UpdateZoomLevel)
            , value (String.fromInt (BoundedInteger.getValue boundedInteger))
            , max <| String.fromInt (BoundedInteger.getUpperBound boundedInteger)
            , min <| String.fromInt (BoundedInteger.getLowerBound boundedInteger)
            , type_ "range"
            ]
            []
        , span
            [ class "zoom__minus"
            , Events.onClick (updateOnClick BoundedInteger.subOne)
            ]
            [ text "-" ]
        ]


viewSearchAsIMove : Model -> Html Msg
viewSearchAsIMove model =
    case model.selectedSession of
        Success _ ->
            text ""

        _ ->
            div [ class "search-control" ]
                [ if model.wasMapMoved then
                    button
                        [ class "button button--primary search-control__button"
                        , Events.onClick FetchSessions
                        ]
                        [ text "Redo Search in Map"
                        , img [ src <| Path.toString model.resetIconWhite, alt "Reset icon" ] []
                        ]

                  else
                    div [ class "search-control__switch" ]
                        [ input
                            [ id "checkbox-search-as-i-move"
                            , type_ "checkbox"
                            , checked model.isSearchAsIMoveOn
                            , Events.onClick ToggleIsSearchOn
                            ]
                            []
                        , label [ for "checkbox-search-as-i-move" ] [ text "Redo search when map is moved" ]
                        ]
                ]


viewHeatMap : WebData HeatMapThresholds -> String -> Path -> Path -> Theme.Icons -> Theme -> WebData SelectedSession -> Html Msg
viewHeatMap heatMapThresholds sensorUnit fitScaleIcon resetIcon icons theme selectedSession =
    let
        ( threshold1, threshold5 ) =
            RemoteData.map HeatMapThresholds.extremes heatMapThresholds
                |> RemoteData.withDefault ( 0, 0 )
    in
    div [ class "heatmap" ]
        [ viewHeatMapInput "min" threshold1 sensorUnit UpdateHeatMapMinimum
        , div [ id "heatmap", class "heatmap-slider" ] []
        , viewHeatMapInput "max" threshold5 sensorUnit UpdateHeatMapMaximum
        , case selectedSession of
            Success session ->
                button
                    [ ariaLabel "Fit scale to stream measurements"
                    , class "heatmap-button heatmap-button--fit-scale"
                    , Events.onClick <| FitHeatMap
                    ]
                    [ img
                        [ src <| Path.toString fitScaleIcon
                        , alt "Fit scale to stream measurements icon"
                        , class "fit-scale-icon"
                        ]
                        []
                    ]

            _ ->
                text ""
        , button
            [ ariaLabel "Reset heatmap"
            , class "heatmap-button"
            , Events.onClick ResetHeatMapToDefaults
            ]
            [ img [ src <| Path.toString resetIcon, alt "Reset icon" ] [] ]
        , button
            [ ariaLabel "Switch colours"
            , class "heatmap-button"
            , Events.onClick ToggleTheme
            ]
            [ img [ src <| Path.toString (Theme.getIcon theme icons), alt "Switch theme icon" ] [] ]
        ]


viewHeatMapInput : String -> Int -> String -> (String -> Msg) -> Html Msg
viewHeatMapInput text_ value_ sensorUnit toMsg =
    div [ class "heatmap-input" ]
        [ p [] [ text text_ ]
        , label [ class "visuallyhidden", for <| "heatmap-" ++ text_ ] [ text <| "Heatmap " ++ text_ ++ " value" ]
        , input
            [ id <| "heatmap-" ++ text_
            , type_ "text"
            , value <| String.fromInt value_
            , onChange toMsg
            ]
            []
        , p [ id <| "heatmap-unit-" ++ text_ ] [ text sensorUnit ]
        ]


viewSessionsOrSelectedSession : Page -> WebData SelectedSession -> Int -> List Session -> WebData HeatMapThresholds -> Path -> Popup.Popup -> EmailForm.EmailForm -> Html Msg
viewSessionsOrSelectedSession page selectedSession fetchableSessionsCount sessions heatMapThresholds linkIcon popup emailForm =
    div
        [ attribute "ng-controller"
            (if page == Mobile then
                "MobileSessionsMapCtrl"

             else
                "FixedSessionsMapCtrl"
            )
        ]
        [ div [ class "sessions", attribute "ng-controller" "SessionsListCtrl" ]
            [ case selectedSession of
                NotAsked ->
                    viewSessions fetchableSessionsCount sessions heatMapThresholds

                Success session ->
                    viewSelectedSession heatMapThresholds (Just session) linkIcon popup (EmailForm.view emailForm ExportSessions NoOp UpdateEmailFormValue)

                Loading ->
                    viewSelectedSession heatMapThresholds Nothing linkIcon popup (EmailForm.view emailForm ExportSessions NoOp UpdateEmailFormValue)

                Failure _ ->
                    div [] [ text "error!" ]
            ]
        ]


viewSelectedSession : WebData HeatMapThresholds -> Maybe SelectedSession -> Path -> Popup.Popup -> Html Msg -> Html Msg
viewSelectedSession heatMapThresholds maybeSession linkIcon popup emailForm =
    div [ class "single-session-container" ]
        [ div [ class "single-session__aside" ]
            (case maybeSession of
                Nothing ->
                    [ text "loading" ]

                Just session ->
                    [ SelectedSession.view session heatMapThresholds linkIcon ShowCopyLinkTooltip ShowExportPopup popup emailForm ]
            )
        , div
            [ class "single-session__graph", id "graph-box" ]
            [ div [ id "graph" ] []
            ]
        , button [ class "close-button single-session__close-button", Events.onClick DeselectSession ] [ text "×" ]
        ]


viewFiltersButtons : WebData SelectedSession -> List Session -> Path -> Popup.Popup -> EmailForm.EmailForm -> Html Msg
viewFiltersButtons selectedSession sessions linkIcon popup emailForm =
    case selectedSession of
        NotAsked ->
            let
                tooltipId =
                    "copy-link-tooltip"
            in
            div [ class "filters__actions action-buttons" ]
                [ button [ class "button button--primary action-button action-button--export", Popup.clickWithoutDefault ShowExportPopup ] [ text "export sessions" ]
                , button [ class "button button--primary action-button action-button--copy-link", Events.onClick <| ShowCopyLinkTooltip tooltipId, id tooltipId ]
                    [ img [ src <| Path.toString linkIcon, alt "Link icon" ] [] ]
                , if Popup.isEmailFormPopupShown popup then
                    EmailForm.view emailForm ExportSessions NoOp UpdateEmailFormValue

                  else
                    text ""
                ]

        _ ->
            text ""


viewSessionTypeNav : Model -> Html Msg
viewSessionTypeNav model =
    ul [ class "session-type-nav" ]
        [ li [ classList [ ( "session-type-nav__item", True ), ( "selected", model.page == Mobile ) ] ]
            [ a
                [ href
                    (Url.Builder.absolute [ "mobile_map#" ]
                        [ Url.Builder.string "keepFiltersExpanded" "true"
                        , Url.Builder.string "theme" (Theme.toString model.theme)
                        ]
                    )
                ]
                [ text "mobile" ]
            , Tooltip.view Tooltip.mobileTab model.tooltipIcon
            ]
        , li [ classList [ ( "session-type-nav__item", True ), ( "selected", model.page == Fixed ) ] ]
            [ a
                [ href
                    (Url.Builder.absolute [ "fixed_map#" ]
                        [ Url.Builder.string "keepFiltersExpanded" "true"
                        , Url.Builder.string "theme" (Theme.toString model.theme)
                        ]
                    )
                ]
                [ text "fixed" ]
            , Tooltip.view Tooltip.fixedTab model.tooltipIcon
            ]
        ]


viewSessions : Int -> List Session -> WebData HeatMapThresholds -> Html Msg
viewSessions fetchableSessionsCount sessions heatMapThresholds =
    let
        sessionsCount =
            sessions |> List.length |> String.fromInt
    in
    if List.length sessions == 0 then
        text ""

    else
        div [ class "session-list" ]
            [ h2 [ class "session-list__header" ]
                [ text "Sessions" ]
            , span [ class "session-list__number" ]
                [ text ("showing " ++ sessionsCount ++ " of " ++ String.fromInt fetchableSessionsCount ++ " results") ]
            , div [ class "session-cards-container", id "session-cards-container" ]
                (List.map (viewSessionCard heatMapThresholds) sessions ++ [ viewLoadMore fetchableSessionsCount (List.length sessions) ])
            ]


viewLoadMore : Int -> Int -> Html Msg
viewLoadMore fetchableSessionsCount sessionCount =
    if sessionCount < fetchableSessionsCount then
        div [ class "more-sessions-button-container" ]
            [ button
                [ id "more-sessions-button"
                , class "button button--primary action-button action-button--more-sessions"
                , Events.onClick LoadMoreSessions
                ]
                [ text "more sessions →" ]
            ]

    else
        text ""


viewSessionCard : WebData HeatMapThresholds -> Session -> Html Msg
viewSessionCard heatMapThresholds session =
    div
        [ class "session-card"
        , class <| Data.Session.classByValue session.average heatMapThresholds
        , Events.onClick <| SelectSession session.id
        , Events.onMouseEnter <| HighlightSessionMarker (Just (Markers.toSessionMarkerData session.location session.id session.average heatMapThresholds))
        , Events.onMouseLeave <| HighlightSessionMarker Nothing
        ]
        [ div
            [ class "session-card__color"
            , class <| Data.Session.classByValue session.average heatMapThresholds
            ]
            []
        , h3 [ class "session-card__name" ]
            [ text session.title ]
        , p [ class "session-card__owner" ]
            [ text session.username ]
        , span [ class "session-card__dates" ]
            [ text <| Times.format session.startTime session.endTime ]
        ]


viewFilters : Model -> Html Msg
viewFilters model =
    case model.page of
        Mobile ->
            viewMobileFilters model

        Fixed ->
            viewFixedFilters model


viewMobileFilters : Model -> Html Msg
viewMobileFilters model =
    div [ class "filters-container" ]
        [ lazy5 viewParameterFilter model.sensors model.selectedSensorId model.tooltipIcon model.isPopupListExpanded model.popup
        , lazy5 viewSensorFilter model.sensors model.selectedSensorId model.tooltipIcon model.isPopupListExpanded model.popup
        , viewLocationFilter model.location model.isIndoor model.tooltipIcon
        , TimeRange.view RefreshTimeRange Dormant model.tooltipIcon model.resetIconWhite
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "+ add profile name" False Tooltip.profilesFilter model.tooltipIcon
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "+ add tag" False Tooltip.tagsFilter model.tooltipIcon
        , viewCrowdMapOptions model.isCrowdMapOn model.crowdMapResolution model.selectedSession model.tooltipIcon
        ]


viewFixedFilters : Model -> Html Msg
viewFixedFilters model =
    div [ class "filters-container" ]
        [ lazy5 viewParameterFilter model.sensors model.selectedSensorId model.tooltipIcon model.isPopupListExpanded model.popup
        , lazy5 viewSensorFilter model.sensors model.selectedSensorId model.tooltipIcon model.isPopupListExpanded model.popup
        , viewLocationFilter model.location model.isIndoor model.tooltipIcon
        , TimeRange.view RefreshTimeRange model.status model.tooltipIcon model.resetIconWhite
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "+ add profile name" model.isIndoor Tooltip.profilesFilter model.tooltipIcon
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "+ add tag" False Tooltip.tagsFilter model.tooltipIcon
        , div [ class "filters__toggle-group" ]
            [ label [] [ text "placement:" ]
            , Tooltip.view Tooltip.typeToggleFilter model.tooltipIcon
            , viewToggleButton "outdoor" (not model.isIndoor) (ToggleIndoor False)
            , viewToggleButton "indoor" model.isIndoor (ToggleIndoor True)
            ]
        , div [ class "filters__toggle-group" ]
            [ label [] [ text "status:" ]
            , Tooltip.view Tooltip.activeToggleFilter model.tooltipIcon
            , viewToggleButton "active" (model.status == Active) (ToggleStatus Active)
            , viewToggleButton "dormant" (model.status == Dormant) (ToggleStatus Dormant)
            ]
        ]


viewToggleButton : String -> Bool -> Msg -> Html Msg
viewToggleButton label isPressed callback =
    button
        [ type_ "button"
        , class "input-filters"
        , if isPressed then
            class "toggle-button toggle-button--pressed"

          else
            class "toggle-button"
        , ariaLabel label
        , Events.onClick callback
        ]
        [ text label ]


viewParameterFilter : List Sensor -> String -> Path -> Bool -> Popup.Popup -> Html Msg
viewParameterFilter sensors selectedSensorId tooltipIcon isPopupListExpanded popup =
    div [ class "filters__input-group" ]
        [ input
            [ id "parameter"
            , class "input-dark"
            , class "input-filters"
            , placeholder "parameter"
            , type_ "text"
            , name "parameter"
            , Popup.clickWithoutDefault (ShowListPopup Popup.ParameterList)
            , value (Sensor.parameterForId sensors selectedSensorId)
            , autocomplete False
            , readonly True
            ]
            []
        , label [ for "parameter" ] [ text "parameter:" ]
        , Tooltip.view Tooltip.parameterFilter tooltipIcon
        , viewListPopup Popup.isParameterPopupShown isPopupListExpanded popup (Sensor.parameters sensors) "parameters" (Sensor.parameterForId sensors selectedSensorId)
        ]


viewSensorFilter : List Sensor -> String -> Path -> Bool -> Popup.Popup -> Html Msg
viewSensorFilter sensors selectedSensorId tooltipIcon isPopupListExpanded popup =
    div [ class "filters__input-group" ]
        [ input
            [ id "sensor"
            , class "input-dark"
            , class "input-filters"
            , placeholder "sensor"
            , type_ "text"
            , name "sensor"
            , Popup.clickWithoutDefault (ShowListPopup Popup.SensorList)
            , value (Sensor.sensorLabelForId sensors selectedSensorId)
            , autocomplete False
            , readonly True
            ]
            []
        , label [ for "sensor" ] [ text "sensor:" ]
        , Tooltip.view Tooltip.sensorFilter tooltipIcon
        , viewListPopup Popup.isSensorPopupShown isPopupListExpanded popup (Sensor.labelsForParameter sensors selectedSensorId) "sensors" (Sensor.sensorLabelForId sensors selectedSensorId)
        ]


viewListPopup : (Popup.Popup -> Bool) -> Bool -> Popup.Popup -> ( List String, List String ) -> String -> String -> Html Msg
viewListPopup isShown isPopupListExpanded popup items itemType selectedItem =
    if isShown popup then
        Popup.viewListPopup TogglePopupState SelectSensorId isPopupListExpanded items itemType selectedItem

    else
        text ""


viewCrowdMapOptions : Bool -> BoundedInteger -> WebData SelectedSession -> Path -> Html Msg
viewCrowdMapOptions isCrowdMapOn crowdMapResolution selectedSession tooltipIcon =
    div [ classList [ ( "disabled-area", RemoteData.isSuccess selectedSession ) ] ]
        [ viewCrowdMapToggle isCrowdMapOn tooltipIcon
        , if isCrowdMapOn then
            viewCrowdMapSlider crowdMapResolution

          else
            text ""
        ]


viewCrowdMapToggle : Bool -> Path -> Html Msg
viewCrowdMapToggle isCrowdMapOn tooltipIcon =
    div [ class "filters__toggle-group" ]
        [ label [] [ text "CrowdMap:" ]
        , viewToggleButton "off" (not isCrowdMapOn) (ToggleCrowdMap False)
        , viewToggleButton "on" isCrowdMapOn (ToggleCrowdMap True)
        , Tooltip.view Tooltip.crowdMap tooltipIcon
        ]


viewCrowdMapSlider : BoundedInteger -> Html Msg
viewCrowdMapSlider boundedInteger =
    div [ id "crowd-map-slider" ]
        [ label [] [ text <| "grid cell size: " ++ String.fromInt (BoundedInteger.getValue boundedInteger) ]
        , div [ class "crowd-map-slider-container" ]
            [ span [ class "minus", Events.onClick (MaybeUpdateResolution BoundedInteger.subOne) ] [ text "-" ]
            , input
                [ class "crowd-map-slider"
                , onChange (String.toInt >> Maybe.withDefault 25 >> UpdateCrowdMapResolution)
                , value (String.fromInt (BoundedInteger.getValue boundedInteger))
                , max <| String.fromInt (BoundedInteger.getUpperBound boundedInteger)
                , min <| String.fromInt (BoundedInteger.getLowerBound boundedInteger)
                , type_ "range"
                ]
                []
            , span [ class "plus", Events.onClick (MaybeUpdateResolution BoundedInteger.addOne) ] [ text "+" ]
            ]
        ]


viewLocationFilter : String -> Bool -> Path -> Html Msg
viewLocationFilter location isIndoor tooltipIcon =
    div [ class "filters__input-group" ]
        [ input
            [ id "location"
            , value location
            , class "input-dark"
            , class "input-filters"
            , placeholder "location"
            , type_ "text"
            , name "location"
            , disabled isIndoor
            ]
            []
        , label [ for "location" ] [ text "location:" ]
        , Tooltip.view Tooltip.locationFilter tooltipIcon
        ]


onEnter : msg -> Html.Attribute msg
onEnter msg =
    let
        isEnter code =
            if code == 13 then
                Decode.succeed msg

            else
                Decode.fail "not ENTER"
    in
    Events.on "keydown" (Decode.andThen isEnter Events.keyCode)


onChange : (String -> msg) -> Html.Attribute msg
onChange tagger =
    Events.on "change" (Decode.map tagger Events.targetValue)



---- PROGRAM ----


main : Program Flags Model Msg
main =
    Browser.application
        { init = init
        , view = viewDocument
        , update = update
        , subscriptions = subscriptions
        , onUrlRequest = UrlRequest
        , onUrlChange = UrlChange
        }


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch <|
        [ Sub.map ProfileLabels <| LabelsInput.subscriptions Ports.profileSelected
        , Sub.map TagsLabels <| LabelsInput.subscriptions Ports.tagSelected
        , Ports.timeRangeSelected UpdateTimeRange
        , Ports.locationCleared (always (UpdateLocationInput ""))
        , Ports.locationUpdated UpdateLocationInput
        , Browser.Events.onClick (Decode.succeed ClosePopup)
        , Ports.updateSessions UpdateSessions
        , Ports.updateIsHttping UpdateIsHttping
        , Ports.toggleSessionSelection ToggleSessionSelectionFromAngular
        , Ports.updateHeatMapThresholdsFromAngular UpdateHeatMapThresholdsFromAngular
        , Ports.mapMoved (always MapMoved)
        , Ports.graphRangeSelected GraphRangeSelected
        , Ports.isShowingTimeRangeFilter UpdateIsShowingTimeRangeFilter
        , Ports.setScroll (always SetScrollPosition)
        , Ports.zoomChanged SaveZoomValue
        ]

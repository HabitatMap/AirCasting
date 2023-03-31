module Main exposing (Msg(..), defaultModel, update, view)

import Api
import Browser exposing (..)
import Browser.Dom as Dom
import Browser.Events
import Browser.Navigation
import Data.BoundedInteger as BoundedInteger exposing (BoundedInteger, LowerBound(..), UpperBound(..), Value(..))
import Data.EmailForm as EmailForm exposing (EmailForm)
import Data.GraphData exposing (GraphData, GraphHeatData, GraphTimeRange)
import Data.HeatMapThresholds as HeatMapThresholds exposing (HeatMapThresholdValues, HeatMapThresholds)
import Data.Markers as Markers exposing (SessionMarkerData)
import Data.Measurements exposing (Measurement)
import Data.Overlay as Overlay exposing (Operation(..), Overlay(..))
import Data.Page as Page exposing (Page(..))
import Data.Path as Path exposing (Path)
import Data.SelectedSession as SelectedSession exposing (SelectedSession)
import Data.Session exposing (..)
import Data.Status as Status exposing (Status(..))
import Data.Theme as Theme exposing (Theme)
import Data.Times as Times
import ExternalUrl
import Html exposing (Html, a, button, div, h2, h3, header, img, input, label, li, main_, nav, p, span, text, ul)
import Html.Attributes exposing (alt, attribute, autocomplete, checked, class, classList, disabled, for, href, id, name, placeholder, readonly, src, target, title, type_, value)
import Html.Attributes.Aria exposing (ariaLabel)
import Html.Events as Events
import Html.Lazy exposing (lazy4, lazy5, lazy7)
import Http
import Json.Decode as Decode
import Json.Encode as Encode
import LabelsInput
import Maybe exposing (..)
import Popup exposing (Popup)
import Ports
import Process
import RemoteData exposing (RemoteData(..), WebData)
import Sensor exposing (Sensor)
import String
import Svgs
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
    , popup : Popup
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
    , fitScaleIcon : Path
    , linkIcon : Path
    , resetIconBlack : Path
    , resetIconWhite : Path
    , themeIcons : Theme.Icons
    , navLogo : Path
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
    , emailForm : EmailForm
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
    , selectedSensorId = "Particulate Matter-airbeam-pm2.5 (µg/m³)"
    , location = ""
    , tags = LabelsInput.empty
    , profiles = LabelsInput.empty
    , isCrowdMapOn = False
    , crowdMapResolution = BoundedInteger.build (LowerBound 1) (UpperBound 40) (Value 20)
    , timeRange = TimeRange.defaultTimeRange
    , isIndoor = False
    , selectedSession = NotAsked
    , fitScaleIcon = Path.empty
    , linkIcon = Path.empty
    , resetIconBlack = Path.empty
    , resetIconWhite = Path.empty
    , themeIcons = Theme.emptyIcons
    , navLogo = Path.empty
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
    , selectedStreamId : Maybe Int
    , sensors : Encode.Value
    , selectedSensorId : String
    , fitScaleIcon : String
    , linkIcon : String
    , resetIconBlack : String
    , resetIconWhite : String
    , themeSwitchIconBlue : String
    , themeSwitchIconDefault : String
    , navLogo : String
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
            case flags.selectedStreamId of
                Nothing ->
                    Overlay.init flags.isIndoor

                Just _ ->
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
        , fitScaleIcon = Path.fromString flags.fitScaleIcon
        , linkIcon = Path.fromString flags.linkIcon
        , resetIconBlack = Path.fromString flags.resetIconBlack
        , resetIconWhite = Path.fromString flags.resetIconWhite
        , themeIcons = Theme.toIcons flags.themeSwitchIconDefault flags.themeSwitchIconBlue
        , navLogo = Path.fromString flags.navLogo
        , isSearchAsIMoveOn = flags.isSearchAsIMoveOn
        , overlay = overlay
        , scrollPosition = flags.scrollPosition
        , theme = Theme.toTheme flags.theme
        , status = Status.toStatus flags.isActive
        , areFiltersExpanded = flags.keepFiltersExpanded
      }
    , Cmd.batch
        [ fetchSelectedStream flags.selectedStreamId page
        , case flags.heatMapThresholdValues of
            Nothing ->
                fetchHeatMapThresholds sensors flags.selectedSensorId

            Just values ->
                fetchHeatMapThresholdDefaults sensors flags.selectedSensorId values
        ]
    )


fetchSelectedStream : Maybe Int -> Page -> Cmd Msg
fetchSelectedStream maybeId page =
    case maybeId of
        Nothing ->
            Cmd.none

        Just id ->
            Process.sleep 1500
                |> Task.perform
                    (\_ ->
                        ExecCmd (SelectedSession.fetch page id (RemoteData.fromResult >> GotSession))
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
    | ShowListPopup Popup
    | ShowExportPopup
    | ExportSessions (Result (List String) (Valid EmailForm))
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
    | ToggleSessionSelectionFromJavaScript (Maybe Int)
    | SelectSession Int
    | GotSession (WebData SelectedSession)
    | GotMeasurements (WebData (List Measurement))
    | UpdateHeatMapThresholds (WebData HeatMapThresholds)
    | UpdateHeatMapMinimum String
    | UpdateHeatMapMaximum String
    | ResetHeatMapToDefaults
    | FitHeatMap
    | UpdateHeatMapThresholdsFromJavaScript HeatMapThresholdValues
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
            let
                limit =
                    100

                message =
                    "You can't export more than " ++ String.fromInt limit ++ " sessions at a time. Use the time frame filter to chunk your exports or use our API."
            in
            if List.length model.sessions > limit then
                ( { model | popup = Popup.EmailForm, emailForm = EmailForm.addFlashMessage model.emailForm message }, Process.sleep 5000 |> Task.perform (always CloseEmailForm) )

            else
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
                    Sensor.idForParameterOrLabel subModel.page value subModel.selectedSensorId subModel.sensors
            in
            ( { subModel | selectedSensorId = selectedSensorId }
            , Cmd.batch
                [ Ports.selectSensorId selectedSensorId
                , fetchHeatMapThresholds subModel.sensors selectedSensorId
                , subCmd
                ]
            )

        UrlChange _ ->
            case model.key of
                Just _ ->
                    ( model, Cmd.none )

                Nothing ->
                    ( model, Cmd.none )

        UrlRequest urlRequest ->
            case urlRequest of
                Internal url ->
                    case model.key of
                        Just _ ->
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

        ToggleSessionSelectionFromJavaScript maybeStreamId ->
            case ( model.selectedSession, maybeStreamId ) of
                ( Success session, Just streamId ) ->
                    if SelectedSession.toStreamId session == streamId then
                        deselectSession model

                    else
                        let
                            ( subModel, subCmd ) =
                                deselectSession model
                        in
                        ( { subModel | overlay = Overlay.update (AddOverlay HttpingOverlay) model.overlay }
                        , Cmd.batch
                            [ SelectedSession.fetch model.page streamId (RemoteData.fromResult >> GotSession)
                            , getScrollPosition
                            , subCmd
                            ]
                        )

                ( _, Just streamId ) ->
                    ( { model | overlay = Overlay.update (AddOverlay HttpingOverlay) model.overlay }
                    , Cmd.batch
                        [ SelectedSession.fetch model.page streamId (RemoteData.fromResult >> GotSession)
                        , getScrollPosition
                        ]
                    )

                ( _, Nothing ) ->
                    ( { model | selectedSession = NotAsked }
                    , Cmd.batch
                        [ Ports.deselectSession ()
                        , Ports.observeSessionsList ()
                        ]
                    )

        SelectSession streamId ->
            case model.selectedSession of
                NotAsked ->
                    ( { model | overlay = Overlay.update (AddOverlay HttpingOverlay) model.overlay }
                    , Cmd.batch
                        [ SelectedSession.fetch model.page streamId (RemoteData.fromResult >> GotSession)
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
                        , Ports.selectSession (SelectedSession.formatForJavaScript newSession)
                        ]
                    )

                _ ->
                    ( { model | selectedSession = response, overlay = Overlay.update (RemoveOverlay HttpingOverlay) model.overlay }, Cmd.none )

        GotMeasurements response ->
            case ( model.heatMapThresholds, model.selectedSession, response ) of
                ( Success _, Success session, Success measurements ) ->
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

        UpdateHeatMapThresholdsFromJavaScript values ->
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
                ( Success thresholds, Success _ ) ->
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

        _ ->
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
        Success _ ->
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


viewDocument : Model -> Browser.Document Msg
viewDocument model =
    { title = "AirCasting"
    , body =
        [ lazy4 viewNav model.navLogo model.sensors model.selectedSensorId model.page
        , viewFiltersForPhone model
        , view model
        ]
    }


view : Model -> Html Msg
view model =
    div [ id "elm-app", class (Theme.toString model.theme) ]
        [ viewMain model
        ]


viewNav : Path -> List Sensor -> String -> Page -> Html Msg
viewNav navLogo sensors selectedSensorId page =
    header [ class "header", id "js-header" ]
        [ div [ class "header__brand" ]
            [ button
                [ class "header__filter-button"
                , title "Filters"
                , type_ "button"
                , ariaLabel "Filters"
                , Events.onClick ToggleFiltersExpanded
                ]
                []
            , div [ class "header__logo" ]
                [ a
                    [ ariaLabel "AirCasting Page"
                    , href ExternalUrl.aircasting
                    , class "u--hide-on-mobile"
                    ]
                    [ img [ src (Path.toString navLogo), alt "Aircasting Logo" ] []
                    ]
                , a
                    [ ariaLabel "Homepage"
                    , href ExternalUrl.habitatMap
                    , class "u--show-on-mobile"
                    ]
                    [ Svgs.habitatMapLogo ]
                ]
            , div
                [ class "filters-info u--show-on-mobile"
                , Events.onClick ToggleFiltersExpanded
                ]
                [ p
                    [ class "filters-info__session-type" ]
                    [ text (Page.toString page)
                    , text " sessions"
                    ]
                , p [ class "filters-info__parameter-sensor" ]
                    [ text (Sensor.parameterForId sensors selectedSensorId)
                    , text " - "
                    , text (Sensor.sensorLabelForId sensors selectedSensorId)
                    ]
                ]
            , button [ class "header__toggle-button js--toggle-nav u--desktop-hidden" ]
                [ Svgs.navOpen
                , Svgs.navClose
                ]
            ]
        , nav [ class "nav" ]
            [ div [ class "nav__main" ]
                [ div [ class "desktop-nav-header u--tablet-max-hidden" ]
                    [ a
                        [ href "https://www.habitatmap.org/"
                        , class "hm-logo"
                        ]
                        [ Svgs.habitatMapLogo ]
                    , button
                        [ class "desktop-nav-header__close-button js--toggle-nav"
                        ]
                        [ Svgs.navClose ]
                    ]
                , ul [ class "nav-list" ]
                    [ li [ class "nav-list__element" ]
                        [ a [ class "nav-list__link", href ExternalUrl.airbeam ]
                            [ text "AirBeam" ]
                        , ul [ class "subnav-list" ]
                            [ li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href ExternalUrl.airbeamUserStories ]
                                    [ text "User Stories" ]
                                ]
                            , li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href ExternalUrl.airbeamHowItWorks ]
                                    [ text "How it Works" ]
                                ]
                            , li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href ExternalUrl.airbeamFaq ]
                                    [ text "FAQ" ]
                                ]
                            , li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href ExternalUrl.airbeamUsersGuide ]
                                    [ text "User's Guide" ]
                                ]
                            , li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href ExternalUrl.airbeamBuy ]
                                    [ text "Buy it Now" ]
                                ]
                            ]
                        ]
                    , li [ class "nav-list__element" ]
                        [ a [ class "nav-list__link", attribute "data-current" "current page", href ExternalUrl.aircasting ]
                            [ text "AirCasting" ]
                        , ul [ class "subnav-list" ]
                            [ li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", attribute "data-current" "current page", href "/map" ]
                                    [ text "AirCasting Maps" ]
                                ]
                            , li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href ExternalUrl.android, target "_blank" ]
                                    [ text "Android App" ]
                                ]
                            , li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href ExternalUrl.iOS, target "_blank" ]
                                    [ text "iOS App" ]
                                ]
                            , li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href ExternalUrl.actions, target "_blank" ]
                                    [ text "AirCasting Actions" ]
                                ]
                            ]
                        ]
                    , li [ class "nav-list__element" ]
                        [ a [ class "nav-list__link", href ExternalUrl.about ]
                            [ text "About HabitatMap" ]
                        , ul [ class "subnav-list" ]
                            [ li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href ExternalUrl.history ]
                                    [ text "History & People" ]
                                ]
                            , li [ class "subnav-list__element" ]
                                [ a [ class "subnav-list__link", href ExternalUrl.press ]
                                    [ text "Press" ]
                                ]
                            ]
                        ]
                    , li [ class "nav-list__element" ]
                        [ a [ class "nav-list__link", href ExternalUrl.blog ]
                            [ text "TakingSpace Blog" ]
                        ]
                    ]
                ]
            , div [ class "nav__sub" ]
                [ a [ class "nav-list__link nav-list__link--search", href ExternalUrl.search ]
                    [ Svgs.search
                    ]
                , a [ class "nav-list__link u--capitalized", href ExternalUrl.donate ]
                    [ text "Donate" ]
                , a [ class "hm-button hm-button--small header__button", href ExternalUrl.airbeamBuy ]
                    [ text "Get Airbeam" ]
                ]
            ]
        , div [ class "u--tablet-max-hidden" ]
            [ a
                [ href "https://www.habitatmap.org/airbeam/buy-it-now"
                , class "button button--small header__button"
                ]
                [ text "Get AirBeam" ]
            , button
                [ class "header__nav-toggle-button js--toggle-nav"
                ]
                [ Svgs.navOpen
                , Svgs.navClose
                ]
            ]
        ]


viewMain : Model -> Html Msg
viewMain model =
    main_
        []
        [ div
            [ classList
                [ ( "maps-page-container", True )
                , ( "with-filters-collapsed", not model.areFiltersExpanded )
                ]
            ]
            [ viewFiltersForDesktop model
            , viewMap model
            ]
        ]


viewFiltersForPhone : Model -> Html Msg
viewFiltersForPhone model =
    div
        [ classList
            [ ( "filters filters--mobile", True )
            , ( "filters--expanded", model.areFiltersExpanded )
            ]
        ]
        [ div [ class "header__brand header__brand--filters" ]
            [ button
                [ class "header__toggle-button"
                , title "Close filters"
                , type_ "button"
                , ariaLabel "Close filters"
                , Events.onClick ToggleFiltersExpanded
                ]
                [ Svgs.navClose ]
            , div
                [ class "filters-info u--show-on-mobile"
                , Events.onClick ToggleFiltersExpanded
                ]
                [ p
                    [ class "filters-info__session-type" ]
                    [ text (Page.toString model.page)
                    , text " sessions"
                    ]
                , p [ class "filters-info__parameter-sensor" ]
                    [ text (Sensor.parameterForId model.sensors model.selectedSensorId)
                    , text " - "
                    , text (Sensor.sensorLabelForId model.sensors model.selectedSensorId)
                    ]
                ]
            , div [ class "nav-icon-placeholder" ] []
            ]
        , viewSessionTypeNav model
        , viewFilters model
        , viewFiltersButtons model.selectedSession model.linkIcon model.popup model.emailForm
        , button
            [ class "show-results-button"
            , Events.onClick CloseFilters
            ]
            [ text "show results" ]
        ]


viewFiltersForDesktop : Model -> Html Msg
viewFiltersForDesktop model =
    div
        [ class "filters filters--desktop" ]
        [ viewSessionTypeNav model
        , viewFilters model
        , viewFiltersButtons model.selectedSession model.linkIcon model.popup model.emailForm
        ]


viewMap : Model -> Html Msg
viewMap model =
    div [ class "maps-content-container" ]
        [ Overlay.view model.overlay
        , div [ class "map-container" ]
            [ viewSearchAsIMove model
            , viewZoomSlider model.zoomLevel
            , div [ class "map", id "map11" ]
                []
            , lazy7 viewSessionsOrSelectedSession model.selectedSession model.fetchableSessionsCount model.sessions model.heatMapThresholds model.linkIcon model.popup model.emailForm
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
            , Html.Attributes.max <| String.fromInt (BoundedInteger.getUpperBound boundedInteger)
            , Html.Attributes.min <| String.fromInt (BoundedInteger.getLowerBound boundedInteger)
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
            Success _ ->
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
            , class "input"
            , type_ "text"
            , value <| String.fromInt value_
            , onChange toMsg
            ]
            []
        , p [ id <| "heatmap-unit-" ++ text_ ] [ text sensorUnit ]
        ]


viewSessionsOrSelectedSession : WebData SelectedSession -> Int -> List Session -> WebData HeatMapThresholds -> Path -> Popup -> EmailForm -> Html Msg
viewSessionsOrSelectedSession selectedSession fetchableSessionsCount sessions heatMapThresholds linkIcon popup emailForm =
    div
        []
        [ div [ class "sessions" ]
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


viewSelectedSession : WebData HeatMapThresholds -> Maybe SelectedSession -> Path -> Popup -> Html Msg -> Html Msg
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


viewFiltersButtons : WebData SelectedSession -> Path -> Popup -> EmailForm -> Html Msg
viewFiltersButtons selectedSession linkIcon popup emailForm =
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
            , Tooltip.view Tooltip.mobileTab
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
            , Tooltip.view Tooltip.fixedTab
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
        , Events.onClick <| SelectSession session.streamId
        , Events.onMouseEnter <| HighlightSessionMarker (Just (Markers.toSessionMarkerData session.location session.streamId session.average heatMapThresholds))
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
    div [ class "filters__form" ]
        [ lazy5 viewParameterFilter model.page model.sensors model.selectedSensorId model.isPopupListExpanded model.popup
        , lazy5 viewSensorFilter model.page model.sensors model.selectedSensorId model.isPopupListExpanded model.popup
        , viewLocationFilter model.location model.isIndoor
        , TimeRange.view RefreshTimeRange model.resetIconWhite
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "js--profile-names-input" "+ add profile name" False Tooltip.profilesFilter
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "js--tags-input" "+ add tag" False Tooltip.tagsFilter
        , viewCrowdMapOptions model.isCrowdMapOn model.crowdMapResolution model.selectedSession
        ]


viewFixedFilters : Model -> Html Msg
viewFixedFilters model =
    div [ class "filters__form" ]
        [ lazy5 viewParameterFilter model.page model.sensors model.selectedSensorId model.isPopupListExpanded model.popup
        , lazy5 viewSensorFilter model.page model.sensors model.selectedSensorId model.isPopupListExpanded model.popup
        , viewLocationFilter model.location model.isIndoor
        , TimeRange.view RefreshTimeRange model.resetIconWhite
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "js--profile-names-input" "+ add profile name" model.isIndoor Tooltip.profilesFilter
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "js--tags-input" "+ add tag" False Tooltip.tagsFilter
        , div [ class "filters__toggle-group" ]
            [ label [ class "label label--filters" ] [ text "placement:" ]
            , Tooltip.view Tooltip.typeToggleFilter
            , viewToggleButton "outdoor" (not model.isIndoor) (ToggleIndoor False)
            , viewToggleButton "indoor" model.isIndoor (ToggleIndoor True)
            ]
        , div [ class "filters__toggle-group" ]
            [ label [ class "label label--filters" ] [ text "status:" ]
            , Tooltip.view Tooltip.activeToggleFilter
            , viewToggleButton "active" (model.status == Active) (ToggleStatus Active)
            , viewToggleButton "dormant" (model.status == Dormant) (ToggleStatus Dormant)
            ]
        ]


viewToggleButton : String -> Bool -> Msg -> Html Msg
viewToggleButton label isPressed callback =
    button
        [ type_ "button"
        , class "input input--filters"
        , if isPressed then
            class "toggle-button toggle-button--pressed"

          else
            class "toggle-button"
        , ariaLabel label
        , Events.onClick callback
        ]
        [ text label ]


viewParameterFilter : Page -> List Sensor -> String -> Bool -> Popup -> Html Msg
viewParameterFilter page sensors selectedSensorId isPopupListExpanded popup =
    div [ class "filters__input-group" ]
        [ input
            [ id "parameter"
            , class "input input--dark input--filters"
            , placeholder "parameter"
            , type_ "text"
            , name "parameter"
            , Popup.clickWithoutDefault (ShowListPopup Popup.ParameterList)
            , value (Sensor.parameterForId sensors selectedSensorId)
            , autocomplete False
            , readonly True
            ]
            []
        , label [ class "label label--filters", for "parameter" ] [ text "parameter:" ]
        , Tooltip.view Tooltip.parameterFilter
        , viewListPopup Popup.isParameterPopupShown isPopupListExpanded popup (Sensor.parameters page sensors) "parameters" (Sensor.parameterForId sensors selectedSensorId)
        ]


viewSensorFilter : Page -> List Sensor -> String -> Bool -> Popup -> Html Msg
viewSensorFilter page sensors selectedSensorId isPopupListExpanded popup =
    let
        sensorLabel : String
        sensorLabel =
            Sensor.sensorLabelForId sensors selectedSensorId
    in
    div [ class "filters__input-group" ]
        [ case sensorLabel of
            "PurpleAir-PM2.5 (µg/m³)" ->
                div [ class "purpleair-link" ]
                    [ a [ href "https://www.purpleair.com", target "_blank" ] [ text "www.purpleair.com" ] ]

            _ ->
                text ""
        , input
            [ id "sensor"
            , class "input input--dark input--filters"
            , placeholder "sensor"
            , type_ "text"
            , name "sensor"
            , Popup.clickWithoutDefault (ShowListPopup Popup.SensorList)
            , value sensorLabel
            , autocomplete False
            , readonly True
            ]
            []
        , label [ class "label label--filters", for "sensor" ] [ text "sensor:" ]
        , Tooltip.view Tooltip.sensorFilter
        , viewListPopup Popup.isSensorPopupShown isPopupListExpanded popup (Sensor.labelsForParameter page sensors selectedSensorId) "sensors" sensorLabel
        ]


viewListPopup : (Popup -> Bool) -> Bool -> Popup -> ( List String, List String ) -> String -> String -> Html Msg
viewListPopup isShown isPopupListExpanded popup items itemType selectedItem =
    if isShown popup then
        Popup.viewListPopup TogglePopupState SelectSensorId isPopupListExpanded items itemType selectedItem

    else
        text ""


viewCrowdMapOptions : Bool -> BoundedInteger -> WebData SelectedSession -> Html Msg
viewCrowdMapOptions isCrowdMapOn crowdMapResolution selectedSession =
    div [ classList [ ( "disabled-area", RemoteData.isSuccess selectedSession ) ] ]
        [ viewCrowdMapToggle isCrowdMapOn
        , if isCrowdMapOn then
            viewCrowdMapSlider crowdMapResolution

          else
            text ""
        ]


viewCrowdMapToggle : Bool -> Html Msg
viewCrowdMapToggle isCrowdMapOn =
    div [ class "filters__toggle-group" ]
        [ label [ class "label label--filters" ] [ text "CrowdMap:" ]
        , viewToggleButton "off" (not isCrowdMapOn) (ToggleCrowdMap False)
        , viewToggleButton "on" isCrowdMapOn (ToggleCrowdMap True)
        , Tooltip.view Tooltip.crowdMap
        ]


viewCrowdMapSlider : BoundedInteger -> Html Msg
viewCrowdMapSlider boundedInteger =
    div [ id "crowd-map-slider" ]
        [ label [ class "label label--filters" ] [ text <| "grid cell size: " ++ String.fromInt (BoundedInteger.getValue boundedInteger) ]
        , div [ class "crowd-map-slider-container" ]
            [ span [ class "minus", Events.onClick (MaybeUpdateResolution BoundedInteger.subOne) ] [ text "-" ]
            , input
                [ class "crowd-map-slider"
                , onChange (String.toInt >> Maybe.withDefault 25 >> UpdateCrowdMapResolution)
                , value (String.fromInt (BoundedInteger.getValue boundedInteger))
                , Html.Attributes.max <| String.fromInt (BoundedInteger.getUpperBound boundedInteger)
                , Html.Attributes.min <| String.fromInt (BoundedInteger.getLowerBound boundedInteger)
                , type_ "range"
                ]
                []
            , span [ class "plus", Events.onClick (MaybeUpdateResolution BoundedInteger.addOne) ] [ text "+" ]
            ]
        ]


viewLocationFilter : String -> Bool -> Html Msg
viewLocationFilter location isIndoor =
    div [ class "filters__input-group" ]
        [ input
            [ id "location"
            , value location
            , class "input input--dark input--filters js--location"
            , placeholder "location"
            , type_ "text"
            , name "location"
            , disabled isIndoor
            ]
            []
        , label [ class "label label--filters", for "location" ] [ text "location:" ]
        , Tooltip.view Tooltip.locationFilter
        ]


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
        , Ports.toggleSessionSelection ToggleSessionSelectionFromJavaScript
        , Ports.updateHeatMapThresholdsFromJavaScript UpdateHeatMapThresholdsFromJavaScript
        , Ports.mapMoved (always MapMoved)
        , Ports.graphRangeSelected GraphRangeSelected
        , Ports.isShowingTimeRangeFilter UpdateIsShowingTimeRangeFilter
        , Ports.setScroll (always SetScrollPosition)
        , Ports.zoomChanged SaveZoomValue
        ]

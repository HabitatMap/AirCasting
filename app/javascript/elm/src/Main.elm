module Main exposing (Msg(..), defaultModel, update, view)

import Browser exposing (..)
import Browser.Dom as Dom
import Browser.Events
import Browser.Navigation
import Data.BoundedInteger as BoundedInteger exposing (BoundedInteger, LowerBound(..), UpperBound(..), Value(..))
import Data.ExportSessions as ExportSessions
import Data.GraphData exposing (GraphData)
import Data.HeatMapThresholds as HeatMapThresholds exposing (HeatMapThresholdValues, HeatMapThresholds, Range(..))
import Data.Overlay as Overlay exposing (Operation(..), Overlay(..), none)
import Data.Page exposing (Page(..))
import Data.Path as Path exposing (Path)
import Data.SelectedSession as SelectedSession exposing (SelectedSession)
import Data.Session exposing (..)
import Data.Status as Status exposing (Status(..))
import Data.Theme as Theme exposing (Theme)
import Data.Times as Times
import Html exposing (Html, a, button, div, h2, h3, header, img, input, label, li, main_, nav, p, span, text, ul)
import Html.Attributes exposing (alt, attribute, autocomplete, checked, class, classList, disabled, for, href, id, max, min, name, placeholder, rel, src, target, title, type_, value)
import Html.Attributes.Aria exposing (ariaLabel, role)
import Html.Events as Events
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
import Validate exposing (Valid)



---- MODEL ----


type alias Model =
    { page : Page
    , key : Maybe Browser.Navigation.Key
    , sessions : List Session
    , fetchableSessionsCount : Int
    , selectedSession : WebData SelectedSession
    , popup : Popup.Popup
    , isPopupExtended : Bool
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
    , linkIcon : Path
    , menuIcon : Path
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
    , isNavExpanded : Bool
    , theme : Theme
    , status : Status
    , emailForm : ExportSessions.EmailForm
    }


defaultModel : Model
defaultModel =
    { page = Mobile
    , key = Nothing
    , sessions = []
    , fetchableSessionsCount = 0
    , popup = Popup.None
    , isPopupExtended = False
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
    , linkIcon = Path.empty
    , menuIcon = Path.empty
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
    , isNavExpanded = False
    , theme = Theme.default
    , status = Status.default
    , emailForm = ExportSessions.defaultEmailForm
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
    , linkIcon : String
    , menuIcon : String
    , resetIconBlack : String
    , resetIconWhite : String
    , themeSwitchIconBlue : String
    , themeSwitchIconDefault : String
    , tooltipIcon : String
    , heatMapThresholdValues : Maybe HeatMapThresholdValues
    , isSearchAsIMoveOn : Bool
    , scrollPosition : Float
    , theme : String
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
        , linkIcon = Path.fromString flags.linkIcon
        , menuIcon = Path.fromString flags.menuIcon
        , resetIconBlack = Path.fromString flags.resetIconBlack
        , resetIconWhite = Path.fromString flags.resetIconWhite
        , themeIcons = Theme.toIcons flags.themeSwitchIconDefault flags.themeSwitchIconBlue
        , tooltipIcon = Path.fromString flags.tooltipIcon
        , heatMapThresholds =
            Maybe.map (Success << HeatMapThresholds.fromValues) flags.heatMapThresholdValues
                |> Maybe.withDefault defaultModel.heatMapThresholds
        , isSearchAsIMoveOn = flags.isSearchAsIMoveOn
        , overlay = Overlay.init flags.isIndoor
        , scrollPosition = flags.scrollPosition
        , theme = Theme.toTheme flags.theme
        , status = Status.toStatus flags.isActive
      }
    , Cmd.batch
        [ fetchSelectedSession sensors flags.selectedSessionId flags.selectedSensorId page
        , case flags.heatMapThresholdValues of
            Nothing ->
                fetchHeatMapThresholds sensors flags.selectedSensorId

            Just values ->
                Ports.updateHeatMapThresholds values
        ]
    )


fetchSelectedSession : List Sensor -> Maybe Int -> String -> Page -> Cmd Msg
fetchSelectedSession sensors maybeId selectedSensorId page =
    case maybeId of
        Nothing ->
            Cmd.none

        Just id ->
            SelectedSession.fetch sensors selectedSensorId page id (RemoteData.fromResult >> GotSession)


fetchHeatMapThresholds : List Sensor -> String -> Cmd Msg
fetchHeatMapThresholds sensors selectedSensorId =
    HeatMapThresholds.fetch sensors selectedSensorId (RemoteData.fromResult >> UpdateHeatMapThresholds)
        |> Maybe.withDefault Cmd.none



---- UPDATE ----


type Msg
    = UpdateLocationInput String
    | SubmitLocation
    | TagsLabels LabelsInput.Msg
    | ProfileLabels LabelsInput.Msg
    | ToggleCrowdMap Bool
    | UpdateCrowdMapResolution Int
    | UpdateTimeRange Encode.Value
    | RefreshTimeRange
    | ShowCopyLinkTooltip String
    | ShowPopup ( List String, List String ) String String
    | ShowExportPopup
    | ExportSessions (Result (List String) (Valid ExportSessions.EmailForm))
    | UpdateEmail String
    | SelectSensorId String
    | ClosePopup
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
    | ToggleSessionSelection Int
    | GotSession (WebData SelectedSession)
    | UpdateHeatMapThresholds (WebData HeatMapThresholds)
    | UpdateHeatMapMinimum String
    | UpdateHeatMapMaximum String
    | ResetHeatMapToDefaults
    | UpdateHeatMapThresholdsFromAngular HeatMapThresholdValues
    | ToggleIsSearchOn
    | MapMoved
    | FetchSessions
    | HighlightSessionMarker (Maybe Location)
    | GraphRangeSelected (List Float)
    | UpdateIsShowingTimeRangeFilter Bool
    | SaveScrollPosition Float
    | SetScrollPosition
    | NoOp
    | NoOp2 (Result Http.Error ())
    | Timeout Int
    | MaybeUpdateResolution (BoundedInteger -> BoundedInteger)
    | ToggleNavExpanded
    | ToggleTheme


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UpdateLocationInput newLocation ->
            ( { model | location = newLocation }, Cmd.none )

        SubmitLocation ->
            let
                ( subModel, subCmd ) =
                    deselectSession model
            in
            ( subModel, Cmd.batch [ subCmd, Ports.findLocation subModel.location ] )

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

        ShowPopup items itemType selectedItem ->
            ( { model | popup = Popup.SelectFrom items itemType selectedItem, isPopupExtended = False, overlay = Overlay.update (AddOverlay PopupOverlay) model.overlay }, Cmd.none )

        ShowExportPopup ->
            ( { model | popup = Popup.Export }, Cmd.none )

        ExportSessions emailFormResult ->
            case emailFormResult of
                Ok emailForm ->
                    ( model, ExportSessions.exportCmd emailForm model.sessions NoOp2 )

                Err errors ->
                    ( { model | emailForm = ExportSessions.updateErrors model.emailForm errors }, Cmd.none )

        UpdateEmail emailForm ->
            ( { model | emailForm = ExportSessions.updateFormValue emailForm }, Cmd.none )

        ClosePopup ->
            ( { model | popup = Popup.None, overlay = Overlay.update (RemoveOverlay PopupOverlay) model.overlay }, Cmd.none )

        TogglePopupState ->
            ( { model | isPopupExtended = not model.isPopupExtended }, Cmd.none )

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
                        ( { model | selectedSession = NotAsked }, Cmd.none )

                    else
                        ( model
                        , Cmd.batch
                            [ SelectedSession.fetch model.sensors model.selectedSensorId model.page id (RemoteData.fromResult >> GotSession)
                            , getScrollPosition
                            ]
                        )

                ( _, Just id ) ->
                    ( model
                    , Cmd.batch
                        [ SelectedSession.fetch model.sensors model.selectedSensorId model.page id (RemoteData.fromResult >> GotSession)
                        , getScrollPosition
                        ]
                    )

                ( _, Nothing ) ->
                    ( { model | selectedSession = NotAsked }, Cmd.none )

        ToggleSessionSelection id ->
            case model.selectedSession of
                NotAsked ->
                    ( model
                    , Cmd.batch
                        [ Ports.toggleSession { deselected = Nothing, selected = Just id }
                        , SelectedSession.fetch model.sensors model.selectedSensorId model.page id (RemoteData.fromResult >> GotSession)
                        , Ports.pulseSessionMarker Nothing
                        , getScrollPosition
                        ]
                    )

                Success selectedSession ->
                    if selectedSession.id == id then
                        ( { model | selectedSession = NotAsked }
                        , Ports.toggleSession { deselected = Just selectedSession.id, selected = Nothing }
                        )

                    else
                        ( { model | selectedSession = NotAsked }
                        , Cmd.batch
                            [ Ports.toggleSession { deselected = Just selectedSession.id, selected = Just id }
                            , SelectedSession.fetch model.sensors model.selectedSensorId model.page id (RemoteData.fromResult >> GotSession)
                            , Ports.pulseSessionMarker Nothing
                            ]
                        )

                _ ->
                    ( model, Cmd.none )

        SaveScrollPosition position ->
            ( { model | scrollPosition = position }, Ports.saveScrollPosition position )

        GotSession response ->
            case ( model.heatMapThresholds, response ) of
                ( Success thresholds, Success selectedSession ) ->
                    ( { model | selectedSession = response }
                    , graphDrawCmd thresholds selectedSession model.sensors model.selectedSensorId model.page
                    )

                _ ->
                    ( { model | selectedSession = response }, Cmd.none )

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
                        , graphDrawCmd (HeatMapThresholds.updateFromValues values thresholds) session model.sensors model.selectedSensorId model.page
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

        HighlightSessionMarker location ->
            ( model, Ports.pulseSessionMarker location )

        GraphRangeSelected measurements ->
            ( { model | selectedSession = SelectedSession.updateRange model.selectedSession measurements }, Cmd.none )

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

        NoOp2 _ ->
            ( model, Cmd.none )

        Timeout int ->
            if int == model.debouncingCounter then
                ( { model | debouncingCounter = 0 }, Ports.updateResolution (51 - BoundedInteger.getValue model.crowdMapResolution) )

            else
                ( model, Cmd.none )

        MaybeUpdateResolution updateResolution ->
            debounce updateResolution model

        ToggleNavExpanded ->
            ( { model | isNavExpanded = not model.isNavExpanded }, Cmd.none )

        ToggleTheme ->
            let
                newTheme =
                    Theme.toggle model.theme
            in
            ( { model | theme = newTheme }, Ports.toggleTheme (Theme.toString newTheme) )


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
        { threshold1, threshold2, threshold3, threshold4, threshold5 } =
            HeatMapThresholds.toValues thresholds

        levels =
            [ { from = threshold1, to = threshold2, className = "first-band" }
            , { from = threshold2, to = threshold3, className = "second-band" }
            , { from = threshold3, to = threshold4, className = "third-band" }
            , { from = threshold4, to = threshold5, className = "fourth-band" }
            ]

        parameter =
            Sensor.parameterForId sensors selectedSensorId

        unit =
            Sensor.unitForSensorId selectedSensorId sensors |> Maybe.withDefault ""
    in
    { sensor = { parameter = parameter, unit = unit }
    , heat = { threshold1 = threshold1, threshold5 = threshold5, levels = levels }
    , times = SelectedSession.times selectedSession
    , streamIds = SelectedSession.toStreamIds selectedSession
    }


type alias Selectable a =
    { a | selectedSession : WebData SelectedSession, scrollPosition : Float }


deselectSession : Selectable a -> ( Selectable a, Cmd Msg )
deselectSession selectable =
    case selectable.selectedSession of
        Success selectedSession ->
            ( { selectable | selectedSession = NotAsked }
            , Cmd.batch
                [ Ports.toggleSession { deselected = Just selectedSession.id, selected = Nothing }
                , Ports.observeSessionsList ()
                ]
            )

        _ ->
            ( selectable, Cmd.none )


getScrollPosition : Cmd Msg
getScrollPosition =
    Dom.getViewportOf "sessions-container"
        |> Task.attempt
            (\result ->
                result
                    |> Result.map (\viewport -> viewport.viewport.x)
                    |> Result.withDefault 0
                    |> SaveScrollPosition
            )


setScrollPosition : Float -> Cmd Msg
setScrollPosition value =
    Dom.setViewportOf "sessions-container" value 0 |> Task.attempt (\_ -> NoOp)



---- VIEW ----


viewDocument : Model -> Browser.Document Msg
viewDocument model =
    { title = "AirCasting"
    , body = [ view model ]
    }


view : Model -> Html Msg
view model =
    div [ id "elm-app", class (Theme.toString model.theme) ]
        [ viewNav model.navLogo model.menuIcon model.isNavExpanded
        , viewMain model
        ]


viewNav : Path -> Path -> Bool -> Html Msg
viewNav navLogo menuIcon isNavExpanded =
    header [ classList [ ( "menu-collapsed", not isNavExpanded ) ] ]
        [ div [ class "logo" ]
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
            [ class "nav__menu-button"
            , title "Menu"
            , type_ "button"
            , ariaLabel "Menu"
            , Events.onClick ToggleNavExpanded
            ]
            [ img [ src <| Path.toString menuIcon, alt "Menu icon" ] []
            ]
        ]


viewMain : Model -> Html Msg
viewMain model =
    main_
        []
        [ div [ class "maps-page-container" ]
            [ div [ class "filters" ]
                [ viewSessionTypeNav model
                , viewFilters model
                , viewFiltersButtons model.selectedSession model.sessions model.linkIcon
                ]
            , Popup.view TogglePopupState SelectSensorId model.isPopupExtended model.popup (ExportSessions.view model.emailForm ExportSessions NoOp UpdateEmail)
            , viewMap model
            ]
        ]


viewMap : Model -> Html Msg
viewMap model =
    div [ class "maps-content-container" ]
        [ Overlay.view model.overlay
        , div [ class "map-container" ]
            [ viewSearchAsIMove model
            , div [ class "map", id "map11", attribute "ng-controller" "MapCtrl", attribute "googlemap" "" ]
                []
            , viewSessionsOrSelectedSession model
            ]
        , viewHeatMap
            model.heatMapThresholds
            (Sensor.unitForSensorId model.selectedSensorId model.sensors |> Maybe.withDefault "")
            model.resetIconBlack
            model.themeIcons
            model.theme
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


viewHeatMap : WebData HeatMapThresholds -> String -> Path -> Theme.Icons -> Theme -> Html Msg
viewHeatMap heatMapThresholds sensorUnit resetIcon icons theme =
    let
        ( threshold1, threshold5 ) =
            RemoteData.map HeatMapThresholds.extremes heatMapThresholds
                |> RemoteData.withDefault ( 0, 0 )
    in
    div [ class "heatmap" ]
        [ viewHeatMapInput "min" threshold1 sensorUnit UpdateHeatMapMinimum
        , div [ id "heatmap", class "heatmap-slider" ] []
        , viewHeatMapInput "max" threshold5 sensorUnit UpdateHeatMapMaximum
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


viewSessionsOrSelectedSession : Model -> Html Msg
viewSessionsOrSelectedSession model =
    div
        [ attribute "ng-controller"
            (if model.page == Mobile then
                "MobileSessionsMapCtrl"

             else
                "FixedSessionsMapCtrl"
            )
        ]
        [ div [ class "sessions" ]
            [ div [ class "single-session", attribute "ng-controller" "SessionsListCtrl" ]
                [ case model.selectedSession of
                    NotAsked ->
                        viewSessions model.fetchableSessionsCount model.sessions model.heatMapThresholds

                    Success session ->
                        viewSelectedSession model.heatMapThresholds (Just session) model.linkIcon

                    Loading ->
                        viewSelectedSession model.heatMapThresholds Nothing model.linkIcon

                    Failure _ ->
                        div [] [ text "error!" ]
                ]
            ]
        ]


viewSelectedSession : WebData HeatMapThresholds -> Maybe SelectedSession -> Path -> Html Msg
viewSelectedSession heatMapThresholds maybeSession linkIcon =
    div [ class "single-session-container" ]
        [ div [ class "single-session__aside" ]
            (case maybeSession of
                Nothing ->
                    [ text "loading" ]

                Just session ->
                    [ SelectedSession.view session heatMapThresholds linkIcon ShowCopyLinkTooltip ]
            )
        , div
            [ class "single-session__graph", id "graph-box" ]
            [ div [ id "graph" ] []
            ]
        , button [ class "close-button single-session__close-button", Events.onClick DeselectSession ] [ text "×" ]
        ]


viewFiltersButtons : WebData SelectedSession -> List Session -> Path -> Html Msg
viewFiltersButtons selectedSession sessions linkIcon =
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
                ]

        _ ->
            text ""


viewSessionTypeNav : Model -> Html Msg
viewSessionTypeNav model =
    div [ class "session-type-nav" ]
        [ a [ href "/mobile_map", classList [ ( "session-type-nav__item", True ), ( "selected", model.page == Mobile ) ] ]
            [ text "mobile", Tooltip.view Tooltip.mobileTab model.tooltipIcon ]
        , a [ href "/fixed_map", classList [ ( "session-type-nav__item", True ), ( "selected", model.page == Fixed ) ] ]
            [ text "fixed", Tooltip.view Tooltip.fixedTab model.tooltipIcon ]
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
        div [ class "sessions-list" ]
            [ h2 [ class "sessions-header" ]
                [ text "Sessions" ]
            , span [ class "sessions-number" ]
                [ text ("showing " ++ sessionsCount ++ " of " ++ String.fromInt fetchableSessionsCount ++ " results") ]
            , div [ class "sessions-container", id "sessions-container" ]
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
        [ class "session"
        , Events.onClick <| ToggleSessionSelection session.id
        , Events.onMouseEnter <| HighlightSessionMarker (Just session.location)
        , Events.onMouseLeave <| HighlightSessionMarker Nothing
        ]
        [ div
            [ class "session-color"
            , class <| Data.Session.classByValue session.average heatMapThresholds
            ]
            []
        , h3 [ class "session-name" ]
            [ text session.title ]
        , p [ class "session-owner" ]
            [ text session.username ]
        , span [ class "session-dates" ]
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
        [ viewParameterFilter model.sensors model.selectedSensorId model.tooltipIcon
        , viewSensorFilter model.sensors model.selectedSensorId model.tooltipIcon
        , viewLocationFilter model.location model.isIndoor model.tooltipIcon
        , TimeRange.view RefreshTimeRange Dormant model.tooltipIcon model.resetIconWhite
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "+ add profile name" False Tooltip.profilesFilter model.tooltipIcon
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "+ add tag" False Tooltip.tagsFilter model.tooltipIcon
        , viewCrowdMapOptions model.isCrowdMapOn model.crowdMapResolution model.selectedSession model.tooltipIcon
        ]


viewFixedFilters : Model -> Html Msg
viewFixedFilters model =
    div [ class "filters-container" ]
        [ viewParameterFilter model.sensors model.selectedSensorId model.tooltipIcon
        , viewSensorFilter model.sensors model.selectedSensorId model.tooltipIcon
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


viewParameterFilter : List Sensor -> String -> Path -> Html Msg
viewParameterFilter sensors selectedSensorId tooltipIcon =
    div [ class "filters__input-group" ]
        [ input
            [ id "parameter"
            , class "input-dark"
            , class "input-filters"
            , placeholder "parameter"
            , type_ "text"
            , name "parameter"
            , Popup.clickWithoutDefault (ShowPopup (Sensor.parameters sensors) "parameters" (Sensor.parameterForId sensors selectedSensorId))
            , value (Sensor.parameterForId sensors selectedSensorId)
            , autocomplete False
            ]
            []
        , label [ for "parameter" ] [ text "parameter:" ]
        , Tooltip.view Tooltip.parameterFilter tooltipIcon
        ]


viewSensorFilter : List Sensor -> String -> Path -> Html Msg
viewSensorFilter sensors selectedSensorId tooltipIcon =
    div [ class "filters__input-group" ]
        [ input
            [ id "sensor"
            , class "input-dark"
            , class "input-filters"
            , placeholder "sensor"
            , type_ "text"
            , name "sensor"
            , Popup.clickWithoutDefault (ShowPopup (Sensor.labelsForParameter sensors selectedSensorId) "sensors" (Sensor.sensorLabelForId sensors selectedSensorId))
            , value (Sensor.sensorLabelForId sensors selectedSensorId)
            , autocomplete False
            ]
            []
        , label [ for "sensor" ] [ text "sensor:" ]
        , Tooltip.view Tooltip.sensorFilter tooltipIcon
        ]


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
            , attribute "autocomplete" "off"
            , Events.onInput UpdateLocationInput
            , onEnter SubmitLocation
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
        , Browser.Events.onClick (Decode.succeed ClosePopup)
        , Ports.updateSessions UpdateSessions
        , Ports.updateIsHttping UpdateIsHttping
        , Ports.toggleSessionSelection ToggleSessionSelectionFromAngular
        , Ports.updateHeatMapThresholdsFromAngular UpdateHeatMapThresholdsFromAngular
        , Ports.mapMoved (always MapMoved)
        , Ports.graphRangeSelected GraphRangeSelected
        , Ports.isShowingTimeRangeFilter UpdateIsShowingTimeRangeFilter
        , Ports.setScroll (always SetScrollPosition)
        ]

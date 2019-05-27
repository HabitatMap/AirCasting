module Main exposing (Msg(..), defaultModel, update, view)

import Api
import Browser exposing (..)
import Browser.Events
import Browser.Navigation
import Data.GraphData exposing (GraphData)
import Data.HeatMapThresholds as HeatMapThresholds exposing (HeatMapThresholdValues, HeatMapThresholds, Range(..))
import Data.Page exposing (Page(..))
import Data.Path as Path exposing (Path)
import Data.SelectedSession as SelectedSession exposing (SelectedSession)
import Data.Session exposing (..)
import Data.Times as Times
import Html exposing (Html, a, button, dd, div, dl, dt, form, h2, h3, img, input, label, li, main_, nav, p, span, text, ul)
import Html.Attributes exposing (alt, attribute, autocomplete, checked, class, classList, disabled, for, href, id, max, min, name, placeholder, rel, src, target, type_, value)
import Html.Attributes.Aria exposing (ariaLabel)
import Html.Events as Events
import Json.Decode as Decode exposing (Decoder(..))
import Json.Encode as Encode
import LabelsInput
import Maybe exposing (..)
import Popup
import Ports
import RemoteData exposing (RemoteData(..), WebData)
import Sensor exposing (Sensor)
import String exposing (fromInt)
import Time exposing (Posix)
import TimeRange exposing (TimeRange)
import Tooltip
import Url exposing (Url)



---- MODEL ----


type alias Model =
    { page : Page
    , key : Maybe Browser.Navigation.Key
    , sessions : List Session
    , fetchableSessionsCount : Int
    , selectedSession : WebData SelectedSession
    , isHttping : Bool
    , popup : Popup.Popup
    , isPopupExtended : Bool
    , sensors : List Sensor
    , selectedSensorId : String
    , location : String
    , tags : LabelsInput.Model
    , profiles : LabelsInput.Model
    , isCrowdMapOn : Bool
    , crowdMapResolution : Int
    , timeRange : TimeRange
    , isIndoor : Bool
    , logoNav : String
    , linkIcon : Path
    , resetIcon : Path
    , resetIconWhite : Path
    , tooltipIcon : Path
    , heatMapThresholds : WebData HeatMapThresholds
    , isStreaming : Bool
    , isSearchAsIMoveOn : Bool
    , wasMapMoved : Bool
    }


defaultModel : Model
defaultModel =
    { page = Mobile
    , key = Nothing
    , sessions = []
    , fetchableSessionsCount = 0
    , isHttping = False
    , popup = Popup.None
    , isPopupExtended = False
    , sensors = []
    , selectedSensorId = "Particulate Matter-airbeam2-pm2.5 (µg/m³)"
    , location = ""
    , tags = LabelsInput.empty
    , profiles = LabelsInput.empty
    , isCrowdMapOn = False
    , crowdMapResolution = 25
    , timeRange = TimeRange.defaultTimeRange
    , isIndoor = False
    , isStreaming = True
    , selectedSession = NotAsked
    , logoNav = ""
    , linkIcon = Path.fromString ""
    , resetIcon = Path.fromString ""
    , resetIconWhite = Path.fromString ""
    , tooltipIcon = Path.fromString ""
    , heatMapThresholds = NotAsked
    , isSearchAsIMoveOn = False
    , wasMapMoved = False
    }


type alias Flags =
    { location : String
    , tags : List String
    , profiles : List String
    , isCrowdMapOn : Bool
    , crowdMapResolution : Int
    , timeRange : Encode.Value
    , isIndoor : Bool
    , isStreaming : Bool
    , selectedSessionId : Maybe Int
    , sensors : Encode.Value
    , selectedSensorId : String
    , logoNav : String
    , linkIcon : String
    , resetIcon : String
    , resetIconWhite : String
    , tooltipIcon : String
    , heatMapThresholdValues : Maybe HeatMapThresholdValues
    , isSearchAsIMoveOn : Bool
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
        , crowdMapResolution = flags.crowdMapResolution
        , timeRange = TimeRange.update defaultModel.timeRange flags.timeRange
        , isIndoor = flags.isIndoor
        , sensors = sensors
        , isStreaming = flags.isStreaming
        , selectedSensorId = flags.selectedSensorId
        , logoNav = flags.logoNav
        , linkIcon = Path.fromString flags.linkIcon
        , resetIcon = Path.fromString flags.resetIcon
        , resetIconWhite = Path.fromString flags.resetIconWhite
        , tooltipIcon = Path.fromString flags.tooltipIcon
        , heatMapThresholds =
            Maybe.map (Success << HeatMapThresholds.fromValues) flags.heatMapThresholdValues
                |> Maybe.withDefault defaultModel.heatMapThresholds
        , isSearchAsIMoveOn = flags.isSearchAsIMoveOn
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
    | ToggleCrowdMap
    | UpdateCrowdMapResolution Int
    | UpdateTimeRange Encode.Value
    | RefreshTimeRange
    | ShowCopyLinkTooltip String
    | ShowPopup ( List String, List String ) String String
    | SelectSensorId String
    | ClosePopup
    | TogglePopupState
    | UrlChange Url
    | UrlRequest Browser.UrlRequest
    | UpdateSessions Encode.Value
    | LoadMoreSessions
    | UpdateIsHttping Bool
    | ToggleIndoor
    | ToggleStreaming
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


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UpdateLocationInput newLocation ->
            ( { model | location = newLocation }, Cmd.none )

        SubmitLocation ->
            let
                ( sudModel, subCmd ) =
                    deselectSession model
            in
            ( sudModel, Cmd.batch [ subCmd, Ports.findLocation sudModel.location ] )

        TagsLabels subMsg ->
            let
                ( sudModel, subCmd1 ) =
                    deselectSession model

                ( subModel2, subCmd2 ) =
                    updateLabels subMsg sudModel.tags Ports.updateTags TagsLabels (\tags -> { sudModel | tags = tags })
            in
            ( subModel2, Cmd.batch [ subCmd1, subCmd2 ] )

        ProfileLabels subMsg ->
            let
                ( sudModel, subCmd1 ) =
                    deselectSession model

                ( subModel2, subCmd2 ) =
                    updateLabels subMsg sudModel.profiles Ports.updateProfiles ProfileLabels (\profiles -> { sudModel | profiles = profiles })
            in
            ( subModel2, Cmd.batch [ subCmd1, subCmd2 ] )

        ToggleCrowdMap ->
            ( { model | isCrowdMapOn = not model.isCrowdMapOn }, Ports.toggleCrowdMap (not model.isCrowdMapOn) )

        UpdateCrowdMapResolution resolution ->
            ( { model | crowdMapResolution = resolution }, Ports.updateResolution resolution )

        UpdateTimeRange value ->
            let
                ( sudModel, subCmd ) =
                    deselectSession model

                newTimeRange =
                    TimeRange.update sudModel.timeRange value
            in
            ( { sudModel | timeRange = newTimeRange }, subCmd )

        RefreshTimeRange ->
            ( model, Ports.refreshTimeRange () )

        ShowCopyLinkTooltip tooltipId ->
            ( model, Ports.showCopyLinkTooltip tooltipId )

        ShowPopup items itemType selectedItem ->
            ( { model | popup = Popup.SelectFrom items itemType selectedItem, isPopupExtended = False }, Cmd.none )

        ClosePopup ->
            ( { model | popup = Popup.None }, Cmd.none )

        TogglePopupState ->
            ( { model | isPopupExtended = not model.isPopupExtended }, Cmd.none )

        SelectSensorId value ->
            let
                ( sudModel, subCmd ) =
                    deselectSession model

                selectedSensorId =
                    Sensor.idForParameterOrLabel value sudModel.selectedSensorId sudModel.sensors
            in
            ( { sudModel | selectedSensorId = selectedSensorId }
            , Cmd.batch
                [ Ports.selectSensorId selectedSensorId
                , fetchHeatMapThresholds sudModel.sensors selectedSensorId
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
            ( { model | isHttping = isHttpingNow }, Cmd.none )

        ToggleIndoor ->
            let
                ( sudModel, subCmd ) =
                    deselectSession model
            in
            if sudModel.isIndoor then
                ( { sudModel | isIndoor = False }
                , Cmd.batch [ Ports.toggleIndoor False, subCmd ]
                )

            else
                ( { sudModel | isIndoor = True, profiles = LabelsInput.empty }
                , Cmd.batch [ Ports.toggleIndoor True, Ports.updateProfiles [], subCmd ]
                )

        ToggleStreaming ->
            let
                ( sudModel, subCmd ) =
                    deselectSession model
            in
            ( { sudModel | isStreaming = not sudModel.isStreaming }
            , Cmd.batch [ Ports.toggleStreaming (not sudModel.isStreaming), subCmd ]
            )

        DeselectSession ->
            deselectSession model

        ToggleSessionSelectionFromAngular maybeId ->
            case ( model.selectedSession, maybeId ) of
                ( Success session, Just id ) ->
                    if SelectedSession.toId session == id then
                        ( { model | selectedSession = NotAsked }, Cmd.none )

                    else
                        ( model, SelectedSession.fetch model.sensors model.selectedSensorId model.page id (RemoteData.fromResult >> GotSession) )

                ( _, Just id ) ->
                    ( model, SelectedSession.fetch model.sensors model.selectedSensorId model.page id (RemoteData.fromResult >> GotSession) )

                ( _, Nothing ) ->
                    ( { model | selectedSession = NotAsked }, Cmd.none )

        ToggleSessionSelection id ->
            case model.selectedSession of
                NotAsked ->
                    ( model
                    , Cmd.batch
                        [ Ports.toggleSession { deselected = Nothing, selected = Just id }
                        , SelectedSession.fetch model.sensors model.selectedSensorId model.page id (RemoteData.fromResult >> GotSession)
                        , Ports.highlightSessionMarker Nothing
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
                            , Ports.highlightSessionMarker Nothing
                            ]
                        )

                _ ->
                    ( model, Cmd.none )

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
            ( model, Ports.highlightSessionMarker location )

        GraphRangeSelected measurements ->
            ( { model | selectedSession = SelectedSession.updateRange model.selectedSession measurements }, Cmd.none )


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
    , streamId = SelectedSession.toStreamId selectedSession
    }


type alias Selectable a =
    { a | selectedSession : WebData SelectedSession }


deselectSession : Selectable a -> ( Selectable a, Cmd Msg )
deselectSession selectable =
    case selectable.selectedSession of
        Success selectedSession ->
            ( { selectable | selectedSession = NotAsked }
            , Ports.toggleSession { deselected = Just selectedSession.id, selected = Nothing }
            )

        _ ->
            ( selectable, Cmd.none )



---- VIEW ----


viewDocument : Model -> Browser.Document Msg
viewDocument model =
    { title = "AirCasting"
    , body = [ view model ]
    }


view : Model -> Html Msg
view model =
    div [ id "elm-app" ]
        [ nav [ class "nav" ]
            [ div [ class "nav-logo" ]
                [ img [ src model.logoNav, alt "Aircasting Logo" ] [] ]
            , ul []
                [ li [ class "" ]
                    [ a [ href "/" ]
                        [ text "Home" ]
                    ]
                , li [ class "" ]
                    [ a [ href "/about" ]
                        [ text "About" ]
                    ]
                , li [ class "active" ]
                    [ a [ href "/map" ]
                        [ text "Maps" ]
                    ]
                , li []
                    [ a [ href "http://www.takingspace.org/", rel "noreferrer", target "_blank" ]
                        [ text "Blog" ]
                    ]
                , li [ class "" ]
                    [ a [ href "/donate" ]
                        [ text "Donate" ]
                    ]
                ]
            ]
        , main_
            []
            [ div [ class "maps-page-container" ]
                [ div [ class "filters" ]
                    [ viewSessionTypeNav model
                    , viewFilters model
                    , viewFiltersButtons model.selectedSession model.sessions model.linkIcon
                    ]
                , Popup.view TogglePopupState SelectSensorId model.isPopupExtended model.popup
                , div [ class "maps-content-container" ]
                    [ if model.isHttping then
                        div [ class "overlay" ]
                            [ div [ class "spinner" ] []
                            ]

                      else
                        text ""
                    , div [ class "map-container" ]
                        [ if model.isIndoor && not model.isHttping then
                            div []
                                [ div [ class "overlay" ] []
                                , div [ class "overlay-info" ] [ p [] [ text "Indoor sessions aren't mapped." ] ]
                                ]

                          else
                            text ""
                        , case model.selectedSession of
                            Success _ ->
                                text ""

                            _ ->
                                viewSearchAsIMove model.wasMapMoved model.isSearchAsIMoveOn model.resetIconWhite
                        , div [ class "map", id "map11", attribute "ng-controller" "MapCtrl", attribute "googlemap" "" ]
                            []
                        , div
                            [ attribute "ng-controller"
                                (if model.page == Mobile then
                                    "MobileSessionsMapCtrl"

                                 else
                                    "FixedSessionsMapCtrl"
                                )
                            ]
                            [ div [ class "sessions" ]
                                [ div [ class "single-session", attribute "ng-controller" "SessionsListCtrl" ]
                                    (viewSessionsOrSelectedSession model.fetchableSessionsCount model.selectedSession model.sessions model.heatMapThresholds model.linkIcon)
                                ]
                            ]
                        ]
                    , viewHeatMap model.heatMapThresholds (Sensor.unitForSensorId model.selectedSensorId model.sensors |> Maybe.withDefault "") model.resetIcon
                    ]
                ]
            ]
        ]


viewSearchAsIMove : Bool -> Bool -> Path -> Html Msg
viewSearchAsIMove wasMapMoved isSearchAsIMoveOn resetIcon =
    div [ class "search-control" ]
        [ if wasMapMoved then
            button
                [ class "button button--primary search-control__button"
                , Events.onClick FetchSessions
                ]
                [ text "Redo Search in Map"
                , img [ src (Path.toString resetIcon), alt "Reset icon" ] []
                ]

          else
            div [ class "search-control__switch" ]
                [ input
                    [ id "checkbox-search-as-i-move"
                    , type_ "checkbox"
                    , checked isSearchAsIMoveOn
                    , Events.onClick ToggleIsSearchOn
                    ]
                    []
                , label [ for "checkbox-search-as-i-move" ] [ text "Redo search when map is moved" ]
                ]
        ]


viewHeatMap : WebData HeatMapThresholds -> String -> Path -> Html Msg
viewHeatMap heatMapThresholds sensorUnit resetIcon =
    let
        ( threshold1, threshold5 ) =
            RemoteData.map HeatMapThresholds.extremes heatMapThresholds
                |> RemoteData.withDefault ( 0, 0 )
    in
    div [ class "heatmap" ]
        [ viewHeatMapInput "min" threshold1 sensorUnit UpdateHeatMapMinimum
        , div [ id "heatmap", class "heatmap-slider" ] []
        , viewHeatMapInput "max" threshold5 sensorUnit UpdateHeatMapMaximum
        , button [ ariaLabel "Reset heatmap", class "reset-heatmap-button", Events.onClick ResetHeatMapToDefaults ]
            [ img [ src (Path.toString resetIcon), alt "Reset icon" ] [] ]
        ]


viewHeatMapInput : String -> Int -> String -> (String -> Msg) -> Html Msg
viewHeatMapInput text_ value_ sensorUnit toMsg =
    div [ class "heatmap-input" ]
        [ p [] [ text text_ ]
        , input
            [ id <| "heatmap-" ++ text_
            , type_ "text"
            , value <| String.fromInt value_
            , onChange toMsg
            ]
            []
        , p [ id <| "heatmap-unit-" ++ text_ ] [ text sensorUnit ]
        ]


viewSessionsOrSelectedSession : Int -> WebData SelectedSession -> List Session -> WebData HeatMapThresholds -> Path -> List (Html Msg)
viewSessionsOrSelectedSession fetchableSessionsCount selectedSession sessions heatMapThresholds linkIcon =
    case selectedSession of
        NotAsked ->
            [ viewSessions fetchableSessionsCount sessions heatMapThresholds ]

        Success session ->
            [ viewSelectedSession heatMapThresholds (Just session) linkIcon ]

        Loading ->
            [ viewSelectedSession heatMapThresholds Nothing linkIcon ]

        Failure _ ->
            [ div [] [ text "error!" ] ]


viewSelectedSession : WebData HeatMapThresholds -> Maybe SelectedSession -> Path -> Html Msg
viewSelectedSession heatMapThresholds maybeSession linkIcon =
    div [ class "single-session-container" ]
        [ div [ class "single-session-info" ]
            (case maybeSession of
                Nothing ->
                    [ text "loading" ]

                Just session ->
                    [ SelectedSession.view session heatMapThresholds linkIcon ShowCopyLinkTooltip ]
            )
        , div
            [ class "single-session-graph", id "graph-box" ]
            [ div [ id "graph" ] []
            ]
        , div [ class "single-session-close" ] [ button [ Events.onClick DeselectSession ] [ text "X" ] ]
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
                [ a [ class "button button--primary action-button action-button--export", target "_blank", href <| Api.exportLink sessions ] [ text "export sessions" ]
                , button [ class "button button--primary action-button action-button--copy-link", Events.onClick <| ShowCopyLinkTooltip tooltipId, id tooltipId ]
                    [ img [ src (Path.toString linkIcon), alt "Link icon" ] [] ]
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
        div []
            [ h2 [ class "sessions-header" ]
                [ text "Sessions" ]
            , span [ class "sessions-number" ]
                [ text ("showing " ++ sessionsCount ++ " of " ++ String.fromInt fetchableSessionsCount ++ " results") ]
            , div [ class "sessions-container" ]
                (List.map (viewSessionCard heatMapThresholds) sessions ++ [ viewLoadMore fetchableSessionsCount (List.length sessions) ])
            ]


viewShortType : Int -> Int -> ShortType -> Html msg
viewShortType length index shortType =
    span [ class shortType.type_ ]
        [ text shortType.name
        , span []
            [ if index == length - 1 then
                text ""

              else
                text "/"
            ]
        ]


viewLoadMore : Int -> Int -> Html Msg
viewLoadMore fetchableSessionsCount sessionCount =
    if sessionCount < fetchableSessionsCount then
        li [] [ button [ Events.onClick LoadMoreSessions ] [ text "Load More..." ] ]

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
        [ div [ class "session-header-container" ]
            [ div
                [ class "session-color"
                , class <| Data.Session.classByValue session.average heatMapThresholds
                ]
                []
            , h3 [ class "session-name" ]
                [ text session.title ]
            ]
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
    form [ class "filters__form" ]
        [ viewParameterFilter model.sensors model.selectedSensorId model.tooltipIcon
        , viewSensorFilter model.sensors model.selectedSensorId model.tooltipIcon
        , viewLocationFilter model.location model.isIndoor model.tooltipIcon
        , TimeRange.view RefreshTimeRange False model.tooltipIcon model.resetIconWhite
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "+ add profile name" False Tooltip.profilesFilter model.tooltipIcon
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "+ add tag" False Tooltip.tagsFilter model.tooltipIcon
        , div [ class "filter-separator" ] []
        , viewCrowdMapOptions model.isCrowdMapOn model.crowdMapResolution model.selectedSession model.tooltipIcon
        ]


viewFixedFilters : Model -> Html Msg
viewFixedFilters model =
    form [ class "filters__form" ]
        [ viewParameterFilter model.sensors model.selectedSensorId model.tooltipIcon
        , viewSensorFilter model.sensors model.selectedSensorId model.tooltipIcon
        , viewLocationFilter model.location model.isIndoor model.tooltipIcon
        , TimeRange.view RefreshTimeRange model.isStreaming model.tooltipIcon model.resetIconWhite
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "+ add profile name" model.isIndoor Tooltip.profilesFilter model.tooltipIcon
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "+ add tag" False Tooltip.tagsFilter model.tooltipIcon
        , div [ class "filters__toggle-group" ]
            [ label [] [ text "type" ]
            , Tooltip.view Tooltip.typeToggleFilter model.tooltipIcon
            , viewToggleButton "outdoor" (not model.isIndoor) ToggleIndoor
            , viewToggleButton "indoor" model.isIndoor ToggleIndoor
            ]
        , div [ class "filters__toggle-group" ]
            [ label [] [ text "streaming" ]
            , Tooltip.view Tooltip.streamingToggleFilter model.tooltipIcon
            , viewToggleButton "active" model.isStreaming ToggleStreaming
            , viewToggleButton "dormant" (not model.isStreaming) ToggleStreaming
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


viewCrowdMapOptions : Bool -> Int -> WebData SelectedSession -> Path -> Html Msg
viewCrowdMapOptions isCrowdMapOn crowdMapResolution selectedSession tooltipIcon =
    div [ classList [ ( "disabled-area", RemoteData.isSuccess selectedSession ) ] ]
        [ viewCrowdMapCheckBox isCrowdMapOn tooltipIcon
        , if isCrowdMapOn then
            viewCrowdMapSlider (String.fromInt crowdMapResolution)

          else
            text ""
        ]


viewCrowdMapCheckBox : Bool -> Path -> Html Msg
viewCrowdMapCheckBox isCrowdMapOn tooltipIcon =
    div [ class "filters__toggle-group" ]
        [ input
            [ id "checkbox-crowd-map"
            , type_ "checkbox"
            , checked isCrowdMapOn
            , Events.onClick ToggleCrowdMap
            ]
            []
        , label [ for "checkbox-crowd-map" ] [ text "Crowd Map" ]
        , Tooltip.view Tooltip.crowdMap tooltipIcon
        ]


viewCrowdMapSlider : String -> Html Msg
viewCrowdMapSlider resolution =
    div [ id "crowd-map-slider" ]
        [ p []
            [ text "Resolution" ]
        , div []
            [ input
                [ class "crowd-map-slider"
                , onChange (String.toInt >> Maybe.withDefault 25 >> UpdateCrowdMapResolution)
                , value resolution
                , max "50"
                , min "10"
                , type_ "range"
                ]
                []
            , span []
                [ text resolution ]
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
        ]

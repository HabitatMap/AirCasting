module Main exposing (Msg(..), defaultModel, exportPath, update, view)

import Browser exposing (..)
import Browser.Events
import Browser.Navigation
import Data.GraphData exposing (GraphData)
import Data.HeatMapThresholds as HeatMapThresholds exposing (HeatMapThresholdValues, HeatMapThresholds, Range(..))
import Data.Page exposing (Page(..))
import Data.SelectedSession as SelectedSession exposing (SelectedSession)
import Data.Session exposing (..)
import Data.Times as Times
import Html exposing (Html, a, button, dd, div, dl, dt, form, h2, h3, img, input, label, li, main_, nav, p, span, text, ul)
import Html.Attributes exposing (attribute, autocomplete, checked, class, classList, disabled, for, href, id, max, min, name, placeholder, rel, src, target, type_, value)
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
import Url exposing (Url)


exportPath : String
exportPath =
    "/api/sessions/export.json"



---- MODEL ----


type alias Model =
    { page : Page
    , key : Maybe Browser.Navigation.Key
    , sessions : List Session
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
    , linkIcon : String
    , heatMapThresholds : WebData HeatMapThresholds
    , isStreaming : Bool
    }


defaultModel : Model
defaultModel =
    { page = Mobile
    , key = Nothing
    , sessions = []
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
    , linkIcon = ""
    , heatMapThresholds = NotAsked
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
    , heatMapThresholdValues : Maybe HeatMapThresholdValues
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
        , linkIcon = flags.linkIcon
        , heatMapThresholds =
            Maybe.map (Success << HeatMapThresholds.fromValues) flags.heatMapThresholdValues
                |> Maybe.withDefault defaultModel.heatMapThresholds
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
    | ShowCopyLinkTooltip
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


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UpdateLocationInput newLocation ->
            ( { model | location = newLocation }, Cmd.none )

        SubmitLocation ->
            ( model, Ports.findLocation model.location )

        TagsLabels subMsg ->
            updateLabels subMsg model.tags Ports.updateTags TagsLabels (\tags -> { model | tags = tags })

        ProfileLabels subMsg ->
            updateLabels subMsg model.profiles Ports.updateProfiles ProfileLabels (\profiles -> { model | profiles = profiles })

        ToggleCrowdMap ->
            ( { model | isCrowdMapOn = not model.isCrowdMapOn }, Ports.toggleCrowdMap (not model.isCrowdMapOn) )

        UpdateCrowdMapResolution resolution ->
            ( { model | crowdMapResolution = resolution }, Ports.updateResolution resolution )

        UpdateTimeRange value ->
            let
                newTimeRange =
                    TimeRange.update model.timeRange value
            in
            ( { model | timeRange = newTimeRange }, Cmd.none )

        RefreshTimeRange ->
            ( model, Ports.refreshTimeRange () )

        ShowCopyLinkTooltip ->
            ( model, Ports.showCopyLinkTooltip () )

        ShowPopup items itemType selectedItem ->
            ( { model | popup = Popup.SelectFrom items itemType selectedItem, isPopupExtended = False }, Cmd.none )

        ClosePopup ->
            ( { model | popup = Popup.None }, Cmd.none )

        TogglePopupState ->
            ( { model | isPopupExtended = not model.isPopupExtended }, Cmd.none )

        SelectSensorId value ->
            let
                selectedSensorId =
                    Sensor.idForParameterOrLabel value model.selectedSensorId model.sensors
            in
            ( { model | selectedSensorId = selectedSensorId }
            , Cmd.batch
                [ Ports.selectSensorId selectedSensorId
                , fetchHeatMapThresholds model.sensors selectedSensorId
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
                sessions =
                    Decode.decodeValue (Decode.list Data.Session.decoder) value
            in
            ( { model | sessions = Result.withDefault [] sessions }, Cmd.none )

        LoadMoreSessions ->
            ( model, Ports.loadMoreSessions () )

        UpdateIsHttping isHttpingNow ->
            ( { model | isHttping = isHttpingNow }, Cmd.none )

        ToggleIndoor ->
            if model.isIndoor then
                ( { model | isIndoor = False }, Ports.toggleIndoor False )

            else
                ( { model | isIndoor = True, profiles = LabelsInput.empty }
                , Cmd.batch [ Ports.toggleIndoor True, Ports.updateProfiles [] ]
                )

        ToggleStreaming ->
            ( { model | isStreaming = not model.isStreaming }, Ports.toggleStreaming (not model.isStreaming) )

        DeselectSession ->
            case model.selectedSession of
                Success selectedSession ->
                    ( { model | selectedSession = NotAsked }, Ports.toggleSession { deselected = Just selectedSession.id, selected = Nothing } )

                _ ->
                    ( model, Cmd.none )

        ToggleSessionSelectionFromAngular maybeId ->
            case maybeId of
                Just id ->
                    ( model, SelectedSession.fetch model.sensors model.selectedSensorId model.page id (RemoteData.fromResult >> GotSession) )

                Nothing ->
                    ( { model | selectedSession = NotAsked }, Cmd.none )

        ToggleSessionSelection id ->
            case model.selectedSession of
                NotAsked ->
                    ( model
                    , Cmd.batch
                        [ Ports.toggleSession { deselected = Nothing, selected = Just id }
                        , SelectedSession.fetch model.sensors model.selectedSensorId model.page id (RemoteData.fromResult >> GotSession)
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
                            ]
                        )

                _ ->
                    ( model, Cmd.none )

        GotSession response ->
            case ( model.heatMapThresholds, response ) of
                ( Success thresholds, Success selectedSession ) ->
                    let
                        params =
                            toGraphParams thresholds selectedSession model.sensors model.selectedSensorId

                        cmd =
                            case model.page of
                                Mobile ->
                                    Ports.drawMobile params

                                Fixed ->
                                    Ports.drawFixed params
                    in
                    ( { model | selectedSession = response }, cmd )

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
            case model.heatMapThresholds of
                Success thresholds ->
                    ( { model | heatMapThresholds = Success <| HeatMapThresholds.updateFromValues values thresholds }
                    , Ports.updateHeatMapThresholds values
                    )

                _ ->
                    ( model, Cmd.none )


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


toGraphParams : HeatMapThresholds -> SelectedSession -> List Sensor -> String -> GraphData
toGraphParams thresholds selectedSession sensors selectedSensorId =
    let
        { threshold1, threshold2, threshold3, threshold4, threshold5 } =
            HeatMapThresholds.toValues thresholds

        levels =
            [ { from = threshold1, to = threshold2, color = "#aaa" }
            , { from = threshold2, to = threshold3, color = "#bbb" }
            , { from = threshold3, to = threshold4, color = "#ccc" }
            , { from = threshold4, to = threshold5, color = "#ddd" }
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
                [ img [ src model.logoNav ] [] ]
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
                [ div [ class "map-filters" ]
                    [ viewSessionTypes model
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
                            div [ class "overlay" ]
                                [ div [ class "change-this-classname-Pina" ] [ text "Indoor sessions aren't mapped." ] ]

                          else
                            text ""
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
                                    (viewSessionsOrSelectedSession model.selectedSession model.sessions model.heatMapThresholds)
                                ]
                            ]
                        ]
                    , viewHeatMap model.heatMapThresholds (Sensor.unitForSensorId model.selectedSensorId model.sensors |> Maybe.withDefault "")
                    ]
                ]
            ]
        ]


viewHeatMap : WebData HeatMapThresholds -> String -> Html Msg
viewHeatMap heatMapThresholds sensorUnit =
    let
        ( threshold1, threshold5 ) =
            RemoteData.map HeatMapThresholds.extremes heatMapThresholds
                |> RemoteData.withDefault ( 0, 0 )
    in
    div [ class "heatmap" ]
        [ viewHeatMapInput "min" threshold1 sensorUnit UpdateHeatMapMinimum
        , div [ id "heatmap", class "heatmap-slider" ] []
        , viewHeatMapInput "max" threshold5 sensorUnit UpdateHeatMapMaximum
        , button [ Events.onClick ResetHeatMapToDefaults ] [ text "D" ]
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


viewSessionsOrSelectedSession : WebData SelectedSession -> List Session -> WebData HeatMapThresholds -> List (Html Msg)
viewSessionsOrSelectedSession selectedSession sessions heatMapThresholds =
    case selectedSession of
        NotAsked ->
            [ viewSessions sessions heatMapThresholds ]

        Success session ->
            [ viewSelectedSession heatMapThresholds <| Just session ]

        Loading ->
            [ viewSelectedSession heatMapThresholds Nothing ]

        Failure _ ->
            [ div [] [ text "error!" ] ]


viewSelectedSession : WebData HeatMapThresholds -> Maybe SelectedSession -> Html Msg
viewSelectedSession heatMapThresholds maybeSession =
    div [ class "single-session-container" ]
        [ div [ class "single-session-info" ]
            (case maybeSession of
                Nothing ->
                    [ text "loading" ]

                Just session ->
                    [ SelectedSession.view session heatMapThresholds ]
            )
        , div
            [ class "single-session-graph", id "graph-box" ]
            [ div [ id "graph" ] []
            ]
        , div [ class "single-session-close" ] [ button [ Events.onClick DeselectSession ] [ text "X" ] ]
        ]


viewFiltersButtons : WebData SelectedSession -> List Session -> String -> Html Msg
viewFiltersButtons selectedSession sessions linkIcon =
    case selectedSession of
        NotAsked ->
            div [ class "filters-buttons" ]
                [ a [ class "filters-button export-button", target "_blank", href <| exportLink sessions ] [ text "export sessions" ]
                , button [ class "filters-button circular-button link-button", Events.onClick ShowCopyLinkTooltip, id "copy-link-tooltip" ]
                    [ img [ src linkIcon ] [] ]
                ]

        _ ->
            text ""


exportLink : List Session -> String
exportLink sessions =
    let
        query =
            String.join "&" << List.map ((++) "session_ids[]=" << String.fromInt << .id)
    in
    exportPath ++ "?" ++ query sessions


viewSessionTypes : Model -> Html Msg
viewSessionTypes model =
    div [ class "sessions-type" ]
        [ a [ href "/mobile_map", classList [ ( "session-type-mobile", True ), ( "selected", model.page == Mobile ) ] ]
            [ text "mobile" ]
        , a [ href "/fixed_map", classList [ ( "session-type-fixed", True ), ( "selected", model.page == Fixed ) ] ]
            [ text "fixed" ]
        ]


viewSessions : List Session -> WebData HeatMapThresholds -> Html Msg
viewSessions sessions heatMapThresholds =
    if List.length sessions == 0 then
        text ""

    else
        div []
            [ h2 [ class "sessions-header" ]
                [ text "Sessions" ]
            , span [ class "sessions-number" ]
                [ text "showing 6 of 500 reuslts" ]
            , div [ class "sessions-container" ]
                (List.map (viewSessionCard heatMapThresholds) sessions ++ [ viewLoadMore <| List.length sessions ])
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


viewLoadMore : Int -> Html Msg
viewLoadMore sessionCount =
    if sessionCount /= 0 && modBy 50 sessionCount == 0 then
        li [] [ button [ Events.onClick LoadMoreSessions ] [ text "Load More..." ] ]

    else
        text ""


viewSessionCard : WebData HeatMapThresholds -> Session -> Html Msg
viewSessionCard heatMapThresholds session =
    let
        ( start, end ) =
            Times.format session.startTime session.endTime
    in
    div
        [ class "session"
        , Events.onClick <| ToggleSessionSelection session.id
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
            [ text start ]
        , span [ class "session-dates" ]
            [ text end ]
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
    form [ class "filters-form" ]
        [ viewParameterFilter model.sensors model.selectedSensorId
        , viewSensorFilter model.sensors model.selectedSensorId
        , viewLocation model.location model.isIndoor
        , TimeRange.view RefreshTimeRange False
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "+ add profile name" False
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "+ add tag" False
        , div [ class "filter-separator" ] []
        , viewCrowdMapCheckBox model.isCrowdMapOn
        , if model.isCrowdMapOn then
            viewCrowdMapSlider (String.fromInt model.crowdMapResolution)

          else
            text ""
        ]


viewFixedFilters : Model -> Html Msg
viewFixedFilters model =
    form [ class "filters-form" ]
        [ viewParameterFilter model.sensors model.selectedSensorId
        , viewSensorFilter model.sensors model.selectedSensorId
        , viewLocation model.location model.isIndoor
        , TimeRange.view RefreshTimeRange model.isStreaming
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "+ add profile name" model.isIndoor
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "+ add tag" False
        , label [] [ text "type" ]
        , div []
            [ viewToggleButton "outdoor" (not model.isIndoor) ToggleIndoor
            , viewToggleButton "indoor" model.isIndoor ToggleIndoor
            ]
        , label [] [ text "streaming" ]
        , div []
            [ viewToggleButton "active" model.isStreaming ToggleStreaming
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


viewParameterFilter : List Sensor -> String -> Html Msg
viewParameterFilter sensors selectedSensorId =
    div []
        [ label [ for "parameter" ] [ text "parameter:" ]
        , input
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
        ]


viewSensorFilter : List Sensor -> String -> Html Msg
viewSensorFilter sensors selectedSensorId =
    div []
        [ label [ for "sensor" ] [ text "sensor:" ]
        , input
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
        ]


viewCrowdMapCheckBox : Bool -> Html Msg
viewCrowdMapCheckBox isCrowdMapOn =
    div []
        [ p []
            [ input
                [ id "checkbox-crowd-map"
                , type_ "checkbox"
                , checked isCrowdMapOn
                , Events.onClick ToggleCrowdMap
                ]
                []
            , label [ for "checkbox-crowd-map" ] [ text "Crowd Map" ]
            ]
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


viewLocation : String -> Bool -> Html Msg
viewLocation location isIndoor =
    div []
        [ label [ for "location" ] [ text "location:" ]
        , input
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
        ]

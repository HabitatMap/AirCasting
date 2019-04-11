module Main exposing (Msg(..), defaultModel, exportPath, update, view)

import Browser exposing (..)
import Browser.Events
import Browser.Navigation
import Data.Page exposing (Page(..))
import Data.SelectedSession as SelectedSession exposing (SelectedSession)
import Data.Session exposing (..)
import Html exposing (Html, a, button, dd, div, dl, dt, form, h2, h3, img, input, label, li, main_, nav, p, span, text, ul)
import Html.Attributes as Attr
import Html.Attributes.Aria exposing (..)
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
    , selectedSession = NotAsked
    , logoNav = ""
    , linkIcon = ""
    }


type alias Flags =
    { location : String
    , tags : List String
    , profiles : List String
    , isCrowdMapOn : Bool
    , crowdMapResolution : Int
    , timeRange : Encode.Value
    , isIndoor : Bool
    , selectedSessionId : Maybe Int
    , sensors : Encode.Value
    , selectedSensorId : String
    , logoNav : String
    , linkIcon : String
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
        , sensors = Sensor.decodeSensors flags.sensors
        , selectedSensorId = flags.selectedSensorId
        , logoNav = flags.logoNav
        , linkIcon = flags.linkIcon
      }
    , case flags.selectedSessionId of
        Nothing ->
            Cmd.none

        Just id ->
            SelectedSession.fetch flags.selectedSensorId page id GotSession
    )



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
    | UpdateSessions (List Session)
    | LoadMoreSessions
    | UpdateIsHttping Bool
    | ToggleIndoor
    | DeselectSession
    | ToggleSessionSelectionFromAngular (Maybe Int)
    | ToggleSessionSelection Int
    | GotSession (WebData SelectedSession)


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
            ( { model | selectedSensorId = selectedSensorId }, Ports.selectSensorId selectedSensorId )

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

        UpdateSessions sessions ->
            ( { model | sessions = sessions }, Cmd.none )

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

        DeselectSession ->
            case model.selectedSession of
                Success selectedSession ->
                    ( { model | selectedSession = NotAsked }, Ports.checkedSession { deselected = Just selectedSession.id, selected = Nothing } )

                _ ->
                    ( model, Cmd.none )

        ToggleSessionSelectionFromAngular maybeId ->
            case maybeId of
                Just id ->
                    ( model, SelectedSession.fetch model.selectedSensorId model.page id GotSession )

                Nothing ->
                    ( { model | selectedSession = NotAsked }, Cmd.none )

        ToggleSessionSelection id ->
            case model.selectedSession of
                NotAsked ->
                    ( model
                    , Cmd.batch
                        [ Ports.checkedSession { deselected = Nothing, selected = Just id }
                        , SelectedSession.fetch model.selectedSensorId model.page id GotSession
                        ]
                    )

                Success selectedSession ->
                    if selectedSession.id == id then
                        ( { model | selectedSession = NotAsked }
                        , Ports.checkedSession { deselected = Just selectedSession.id, selected = Nothing }
                        )

                    else
                        ( { model | selectedSession = NotAsked }
                        , Cmd.batch
                            [ Ports.checkedSession { deselected = Just selectedSession.id, selected = Just id }
                            , SelectedSession.fetch model.selectedSensorId model.page id GotSession
                            ]
                        )

                _ ->
                    ( model, Cmd.none )

        GotSession response ->
            ( { model | selectedSession = response }, Cmd.none )


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



---- VIEW ----


viewDocument : Model -> Browser.Document Msg
viewDocument model =
    { title = "AirCasting"
    , body = [ view model ]
    }


view : Model -> Html Msg
view model =
    div [ Attr.id "elm-app" ]
        [ nav [ Attr.class "nav" ]
            [ div [ Attr.class "nav-logo" ]
                [ img [ Attr.src model.logoNav ] [] ]
            , ul []
                [ li [ Attr.class "" ]
                    [ a [ Attr.href "/" ]
                        [ text "Home" ]
                    ]
                , li [ Attr.class "" ]
                    [ a [ Attr.href "/about" ]
                        [ text "About" ]
                    ]
                , li [ Attr.class "active" ]
                    [ a [ Attr.href "/map" ]
                        [ text "Maps" ]
                    ]
                , li []
                    [ a [ Attr.href "http://www.takingspace.org/", Attr.rel "noreferrer", Attr.target "_blank" ]
                        [ text "Blog" ]
                    ]
                , li [ Attr.class "" ]
                    [ a [ Attr.href "/donate" ]
                        [ text "Donate" ]
                    ]
                ]
            ]
        , main_
            []
            [ div [ Attr.class "maps-page-container" ]
                [ div [ Attr.class "map-filters" ]
                    [ viewSessionTypes model
                    , viewFilters model
                    , viewFiltersButtons model.selectedSession model.sessions model.linkIcon
                    ]
                , Popup.view TogglePopupState SelectSensorId model.isPopupExtended model.popup
                , div [ Attr.class "maps-content-container" ]
                    [ if model.isHttping then
                        div [ Attr.class "overlay" ]
                            [ div [ Attr.class "lds-dual-ring" ] []
                            ]

                      else
                        text ""
                    , div [ Attr.class "map-container" ]
                        [ if model.isIndoor && not model.isHttping then
                            div [ Attr.class "overlay" ]
                                [ div [ Attr.class "change-this-classname-Pina" ] [ text "Indoor sessions aren't mapped." ] ]

                          else
                            text ""
                        , div [ Attr.class "map", Attr.id "map11", Attr.attribute "ng-controller" "MapCtrl", Attr.attribute "googlemap" "" ]
                            []
                        , div
                            [ Attr.attribute "ng-controller"
                                (if model.page == Mobile then
                                    "MobileSessionsMapCtrl"

                                 else
                                    "FixedSessionsMapCtrl"
                                )
                            ]
                            [ div [ Attr.class "sessions", Attr.attribute "ng-controller" "SessionsGraphCtrl" ]
                                [ div [ Attr.attribute "ng-controller" "SessionsListCtrl" ] (viewSessionsOrSelectedSession model.selectedSession model.sessions) ]
                            ]
                        ]
                    , div [ Attr.class "heatmap" ]
                        [ text "A place for heatmap    " ]
                    ]
                ]
            ]
        ]


viewSessionsOrSelectedSession : WebData SelectedSession -> List Session -> List (Html Msg)
viewSessionsOrSelectedSession selectedSession sessions =
    case selectedSession of
        NotAsked ->
            [ viewSessions sessions ]

        Success session ->
            [ viewSelectedSession <| Just session ]

        Loading ->
            [ viewSelectedSession Nothing ]

        Failure _ ->
            [ div [] [ text "error!" ] ]


viewSelectedSession : Maybe SelectedSession -> Html Msg
viewSelectedSession maybeSession =
    div [ Attr.class "single-session-container" ]
        [ div [ Attr.class "single-session-info" ]
            (case maybeSession of
                Nothing ->
                    [ text "loading" ]

                Just session ->
                    [ SelectedSession.view session ]
            )
        , div
            [ Attr.class "single-session-graph", Attr.id "graph-box" ]
            [ div [ Attr.id "graph" ] []
            ]
        , div [ Attr.class "single-session-close" ] [ button [ Events.onClick DeselectSession ] [ text "X" ] ]
        ]


viewFiltersButtons : WebData SelectedSession -> List Session -> String -> Html Msg
viewFiltersButtons selectedSession sessions linkIcon =
    case selectedSession of
        NotAsked ->
            div [ Attr.class "filters-buttons" ]
                [ a [ Attr.class "filters-button export-button", Attr.target "_blank", Attr.href <| exportLink sessions ] [ text "export sessions" ]
                , button [ Attr.class "filters-button circular-button", Events.onClick ShowCopyLinkTooltip, Attr.id "copy-link-tooltip" ]
                    [ img [ Attr.src linkIcon ] [] ]
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
    div [ Attr.class "sessions-type" ]
        [ a [ Attr.href "/mobile_map", Attr.classList [ ( "session-type-mobile", True ), ( "selected", model.page == Mobile ) ] ]
            [ text "mobile" ]
        , a [ Attr.href "/fixed_map", Attr.classList [ ( "session-type-fixed", True ), ( "selected", model.page == Fixed ) ] ]
            [ text "fixed" ]
        ]


viewSessions : List Session -> Html Msg
viewSessions sessions =
    if List.length sessions == 0 then
        text ""

    else
        div []
            [ h2 [ Attr.class "sessions-header" ]
                [ text "Sessions" ]
            , span [ Attr.class "sessions-number" ]
                [ text "showing 6 of 500 reuslts" ]
            , div [ Attr.class "sessions-container" ]
                (List.map viewSessionCard sessions ++ [ viewLoadMore <| List.length sessions ])
            ]


viewShortType : Int -> Int -> ShortType -> Html msg
viewShortType length index shortType =
    span [ Attr.class shortType.type_ ]
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


viewSessionCard : Session -> Html Msg
viewSessionCard session =
    div
        [ Attr.class "session"
        , Events.onClick <| ToggleSessionSelection session.id
        ]
        [ div [ Attr.class "session-header-container" ]
            [ div [ Attr.class "session-color heat-lvl1-bg" ]
                []
            , h3 [ Attr.class "session-name" ]
                [ text session.title ]
            ]
        , p [ Attr.class "session-owner" ]
            [ text session.username ]
        , p [ Attr.class "session-dates" ]
            [ text session.startTime ]
        , p [ Attr.class "session-dates" ]
            [ text session.endTime ]
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
    form [ Attr.class "filters-form" ]
        [ viewParameterFilter model.sensors model.selectedSensorId
        , viewSensorFilter model.sensors model.selectedSensorId
        , viewLocation model.location model.isIndoor
        , TimeRange.view RefreshTimeRange
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "+ add profile name" False
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "+ add tag" False
        , div [ Attr.class "filter-separator" ] []
        , viewCrowdMapCheckBox model.isCrowdMapOn
        , if model.isCrowdMapOn then
            viewCrowdMapSlider (String.fromInt model.crowdMapResolution)

          else
            text ""
        ]


viewFixedFilters : Model -> Html Msg
viewFixedFilters model =
    form [ Attr.class "filters-form" ]
        [ viewParameterFilter model.sensors model.selectedSensorId
        , viewSensorFilter model.sensors model.selectedSensorId
        , viewLocation model.location model.isIndoor
        , TimeRange.view RefreshTimeRange
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "+ add profile name" model.isIndoor
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "+ add tag" False
        , label [] [ text "type" ]
        , div []
            [ viewToggleButton "outdoor" (not model.isIndoor) ToggleIndoor
            , viewToggleButton "indoor" model.isIndoor ToggleIndoor
            ]
        ]


viewToggleButton : String -> Bool -> Msg -> Html Msg
viewToggleButton label isPressed callback =
    button
        [ Attr.type_ "button"
        , if isPressed then
            Attr.class "toggle-button toggle-button--pressed"

          else
            Attr.class "toggle-button"
        , ariaLabel label
        , Events.onClick callback
        ]
        [ text label ]


viewParameterFilter : List Sensor -> String -> Html Msg
viewParameterFilter sensors selectedSensorId =
    div []
        [ label [ Attr.for "parameter" ] [ text "parameter:" ]
        , input
            [ Attr.id "parameter"
            , Attr.class "input-dark"
            , Attr.class "input-filters"
            , Attr.placeholder "parameter"
            , Attr.type_ "text"
            , Attr.name "parameter"
            , Popup.clickWithoutDefault (ShowPopup (Sensor.parameters sensors) "parameters" (Sensor.parameterForId sensors selectedSensorId))
            , Attr.value (Sensor.parameterForId sensors selectedSensorId)
            , Attr.autocomplete False
            ]
            []
        ]


viewSensorFilter : List Sensor -> String -> Html Msg
viewSensorFilter sensors selectedSensorId =
    div []
        [ label [ Attr.for "sensor" ] [ text "sensor:" ]
        , input
            [ Attr.id "sensor"
            , Attr.class "input-dark"
            , Attr.class "input-filters"
            , Attr.placeholder "sensor"
            , Attr.type_ "text"
            , Attr.name "sensor"
            , Popup.clickWithoutDefault (ShowPopup (Sensor.labelsForParameter sensors selectedSensorId) "sensors" (Sensor.sensorLabelForId sensors selectedSensorId))
            , Attr.value (Sensor.sensorLabelForId sensors selectedSensorId)
            , Attr.autocomplete False
            ]
            []
        ]


viewCrowdMapCheckBox : Bool -> Html Msg
viewCrowdMapCheckBox isCrowdMapOn =
    div []
        [ p []
            [ input
                [ Attr.id "checkbox-crowd-map"
                , Attr.type_ "checkbox"
                , Attr.checked isCrowdMapOn
                , Events.onClick ToggleCrowdMap
                ]
                []
            , label [ Attr.for "checkbox-crowd-map" ] [ text "Crowd Map" ]
            ]
        ]


viewCrowdMapSlider : String -> Html Msg
viewCrowdMapSlider resolution =
    div [ Attr.id "crowd-map-slider" ]
        [ p []
            [ text "Resolution" ]
        , div []
            [ input
                [ Attr.class "crowd-map-slider"
                , onChange (String.toInt >> Maybe.withDefault 25 >> UpdateCrowdMapResolution)
                , Attr.value resolution
                , Attr.max "50"
                , Attr.min "10"
                , Attr.type_ "range"
                ]
                []
            , span []
                [ text resolution ]
            ]
        ]


viewLocation : String -> Bool -> Html Msg
viewLocation location isIndoor =
    div []
        [ label [ Attr.for "location" ] [ text "location:" ]
        , input
            [ Attr.id "location"
            , Attr.value location
            , Attr.class "input-dark"
            , Attr.class "input-filters"
            , Attr.placeholder "location"
            , Attr.type_ "text"
            , Attr.name "location"
            , Attr.disabled isIndoor
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
        ]

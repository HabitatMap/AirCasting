module Main exposing (Msg(..), Page(..), defaultModel, exportPath, update, view)

import Browser exposing (..)
import Browser.Events
import Browser.Navigation
import Data.Session exposing (..)
import Html exposing (Html, a, button, dd, div, dl, dt, form, h2, h3, h4, img, input, label, li, main_, nav, p, span, text, ul)
import Html.Attributes as Attr
import Html.Events as Events
import Json.Decode as Decode
import Json.Encode as Encode
import LabelsInput
import Maybe exposing (..)
import Popup
import Ports
import String exposing (fromInt)
import TimeRange exposing (TimeRange)
import Url exposing (Url)


exportPath : String
exportPath =
    "/api/sessions/export.json"



---- MODEL ----


type Page
    = Fixed
    | Mobile


type alias Model =
    { page : Page
    , key : Maybe Browser.Navigation.Key
    , sessions : List Session
    , selectedSessionId : Maybe Int
    , isHttping : Bool
    , popup : Popup.Popup
    , isPopupExtended : Bool
    , parameters : Popup.Items
    , selectedParameter : String
    , selectedSensor : String
    , location : String
    , tags : LabelsInput.Model
    , profiles : LabelsInput.Model
    , isCrowdMapOn : Bool
    , crowdMapResolution : Int
    , timeRange : TimeRange
    , isIndoor : Bool
    }


defaultModel : Model
defaultModel =
    { page = Mobile
    , key = Nothing
    , sessions = []
    , selectedSessionId = Nothing
    , isHttping = False
    , popup = Popup.None
    , isPopupExtended = False
    , parameters =
        { main = [ "Particulate Matter", "Humidity", "Temperature", "Sound Level" ]
        , other = Nothing
        }
    , selectedParameter = "Particulate Matter"
    , selectedSensor = "AirBeam2-PM2.5 (ug/m3)"
    , location = ""
    , tags = LabelsInput.empty
    , profiles = LabelsInput.empty
    , isCrowdMapOn = False
    , crowdMapResolution = 25
    , timeRange = TimeRange.defaultTimeRange
    , isIndoor = False
    }


type alias Flags =
    { location : String
    , tags : List String
    , profiles : List String
    , isCrowdMapOn : Bool
    , crowdMapResolution : Int
    , timeRange : Encode.Value

    -- , selectedParameter : String
    , parametersList : Encode.Value
    , isIndoor : Bool
    , selectedSessionId : Maybe Int
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

        result =
            Decode.decodeValue (Decode.list (Decode.field "id" Decode.string)) flags.parametersList

        fetchedParameters =
            case result of
                Ok values ->
                    values
                        |> List.filter (\value -> not (List.member value defaultModel.parameters.main))
                        |> List.sort
                        |> Just

                Err _ ->
                    Nothing
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

        -- , selectedParameter = flags.selectedParameter
        , parameters = { main = defaultModel.parameters.main, other = fetchedParameters }
        , isIndoor = flags.isIndoor
        , selectedSessionId = flags.selectedSessionId
      }
    , Ports.selectParameter defaultModel.selectedParameter
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
    | ShowCopyLinkTooltip
    | ShowExpandableSelectFromPopup
    | ShowSelectFormPopup
    | SelectParameter String
    | ClosePopup
    | TogglePopupState
    | UrlChange Url
    | UrlRequest Browser.UrlRequest
    | ToggleSessionSelection Int
    | UpdateSessions (List Session)
    | LoadMoreSessions
    | UpdateIsHttping Bool
    | ToggleIndoor Bool
    | DeselectSession
    | ToggleSessionSelectionFromAngular (Maybe Int)


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

        ShowCopyLinkTooltip ->
            ( model, Ports.showCopyLinkTooltip () )

        ShowExpandableSelectFromPopup ->
            ( { model | popup = Popup.ExpandableSelectFrom model.parameters }, Cmd.none )

        ShowSelectFormPopup ->
            ( { model | popup = Popup.SelectFrom [ "a", "b" ] }, Cmd.none )

        ClosePopup ->
            ( { model | popup = Popup.None, isPopupExtended = False }, Cmd.none )

        TogglePopupState ->
            ( { model | isPopupExtended = not model.isPopupExtended }, Cmd.none )

        SelectParameter parameter ->
            ( { model | selectedParameter = parameter }, Ports.selectParameter parameter )

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

        ToggleSessionSelection id ->
            if model.selectedSessionId == Just id then
                ( { model | selectedSessionId = Nothing }
                , Ports.checkedSession { deselected = model.selectedSessionId, selected = Nothing }
                )

            else
                ( { model | selectedSessionId = Just id }
                , Ports.checkedSession { deselected = model.selectedSessionId, selected = Just id }
                )

        UpdateSessions sessions ->
            ( { model | sessions = sessions }, Cmd.none )

        LoadMoreSessions ->
            ( model, Ports.loadMoreSessions () )

        UpdateIsHttping isHttpingNow ->
            ( { model | isHttping = isHttpingNow }, Cmd.none )

        ToggleIndoor value ->
            ( { model | isIndoor = value }, Ports.toggleIndoor value )

        DeselectSession ->
            ( { model | selectedSessionId = Nothing }, Ports.checkedSession { deselected = model.selectedSessionId, selected = Nothing } )

        ToggleSessionSelectionFromAngular maybeId ->
            case maybeId of
                Just id ->
                    ( { model | selectedSessionId = Just id }, Cmd.none )

                Nothing ->
                    ( { model | selectedSessionId = Nothing }, Cmd.none )


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
                [ img [ Attr.src "aircasting-logo-nav.svg" ] [] ]
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
                    , viewFiltersButtons model.selectedSessionId model.sessions
                    ]
                , Popup.viewPopup TogglePopupState SelectParameter model.isPopupExtended model.popup
                , div [ Attr.class "maps-content-container" ]
                    [ if model.isHttping then
                        div [ Attr.class "overlay" ]
                            [ div [ Attr.class "lds-dual-ring" ] []
                            ]

                      else
                        text ""
                    , div [ Attr.class "map-container" ]
                        [ if model.isIndoor && not model.isHttping then
                            div [ Attr.class "overlay" ] []

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
                                [ div [ Attr.attribute "ng-controller" "SessionsListCtrl" ]
                                    (case model.selectedSessionId of
                                        Nothing ->
                                            [ h2 [ Attr.class "sessions-header" ]
                                                [ text "Sessions" ]
                                            , span [ Attr.class "sessions-number" ]
                                                [ text "showing 6 of 500 reuslts" ]
                                            , viewSessions model
                                            ]

                                        Just _ ->
                                            [ div [ Attr.class "single-session-container" ]
                                                [ div [ Attr.class "single-session-info" ]
                                                    [ p [ Attr.class "single-session-owner" ] [ text "NYCEJA" ] ]
                                                , div
                                                    [ Attr.class "single-session-graph", Attr.id "graph-box" ]
                                                    [ div [ Attr.id "graph" ] []
                                                    ]
                                                , div [ Attr.class "single-session-close" ] [ button [ Events.onClick DeselectSession ] [ text "X" ] ]
                                                ]
                                            ]
                                    )
                                ]
                            ]
                        ]
                    , div [ Attr.class "heatmap" ]
                        [ text "A place for heatmap    " ]
                    ]
                ]
            ]
        ]


viewFiltersButtons : Maybe Int -> List Session -> Html Msg
viewFiltersButtons selectedSessionId sessions =
    case selectedSessionId of
        Just _ ->
            text ""

        Nothing ->
            div [ Attr.class "filters-buttons" ]
                [ a [ Attr.class "filters-button export-button", Attr.target "_blank", Attr.href <| exportLink sessions ] [ text "export sessions" ]
                , button [ Attr.class "filters-button circular-button", Events.onClick ShowCopyLinkTooltip, Attr.id "copy-link-tooltip" ] [ text "oo" ]
                ]


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


viewSessions : Model -> Html Msg
viewSessions model =
    div [ Attr.class "sessions-container" ]
        (List.map (viewSessionCard model.selectedSessionId) model.sessions
            ++ [ viewLoadMore <| List.length model.sessions ]
        )


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


viewSession : Maybe Int -> Session -> Html Msg
viewSession selectedSessionId session =
    li
        [ Events.onClick <| ToggleSessionSelection session.id ]
        [ input
            [ Attr.type_ "radio"
            , Attr.id <| "radio-" ++ fromInt session.id
            , Attr.checked <| selectedSessionId == Just session.id
            ]
            []
        , dl
            []
            [ dt
                []
                [ label
                    [ Attr.class "narrow" ]
                    [ text session.title ]
                ]
            , dd []
                [ label
                    [ Attr.class "narrow" ]
                    ([ div [] [ text <| session.username ++ ", " ++ session.timeframe ]
                     ]
                        ++ List.indexedMap (viewShortType <| List.length session.shortTypes) session.shortTypes
                    )
                ]
            ]
        ]


viewSessionCard : Maybe Int -> Session -> Html Msg
viewSessionCard selectedSessionId session =
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
            [ text session.timeframe ]
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
        [ viewParameterFilter model.selectedParameter
        , viewSensorFilter model.selectedSensor
        , viewLocation model.location model.isIndoor
        , TimeRange.view
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "+ add profile name"
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "+ add tag"
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
        [ viewParameterFilter model.selectedParameter
        , viewLocation model.location
        , TimeRange.view
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "profile names:" "profile-names" "+ add profile name"
        , Html.map TagsLabels <| LabelsInput.view model.tags "tags:" "tags" "+ add tag"
        , label
            []
            [ input
                [ Attr.type_ "checkbox"
                , Attr.checked model.isIndoor
                , Attr.id "indoor-filter"
                , Events.onCheck ToggleIndoor
                ]
                []
            , text "Only show indoor sessions"
            ]
        ]


viewParameterFilter : String -> Html Msg
viewParameterFilter selectedParameter =
    div []
        [ label [ Attr.for "parameter" ] [ text "parameter:" ]
        , input
            [ Attr.id "parameter"
            , Attr.class "input-dark"
            , Attr.class "input-filters"
            , Attr.placeholder "parameter"
            , Attr.type_ "text"
            , Attr.name "parameter"
            , Popup.clickWithoutDefault ShowExpandableSelectFromPopup
            , Attr.value selectedParameter
            ]
            []
        ]


viewSensorFilter : String -> Html Msg
viewSensorFilter selectedSensor =
    div []
        [ label [ Attr.for "sensor" ] [ text "sensor:" ]
        , input
            [ Attr.id "sensor-filter"
            , Attr.class "input-dark"
            , Attr.class "input-filters"
            , Attr.placeholder "sensor"
            , Attr.type_ "text"
            , Attr.name "sensor"
            , Popup.clickWithoutDefault ShowSelectFormPopup
            , Attr.value selectedSensor
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

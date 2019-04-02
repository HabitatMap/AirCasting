port module Yellow exposing (Flags, Model, Msg(..), init, main, update, view)

import Browser exposing (..)
import Browser.Navigation
import Html exposing (Html, a, button, dd, div, dl, dt, form, h2, h3, h4, input, label, li, main_, nav, p, span, text, ul)
import Html.Attributes as Attr
import Html.Events as Events
import Json.Decode as Decode
import Json.Encode as Encode
import LabelsInput
import Maybe exposing (..)
import Ports
import String exposing (fromInt)
import TimeRange exposing (TimeRange)
import Url exposing (Url)



---- MODEL ----


type alias Flags =
    { crowdMapResolution : Int
    , isCrowdMapOn : Bool
    , tags : List String
    , profiles : List String
    , timeRange : Encode.Value
    }


type alias ShortType =
    { name : String
    , type_ : String
    }


type alias Session =
    { title : String
    , id : Int
    , timeframe : String
    , username : String
    , shortTypes : List ShortType
    , selected : Bool -- THIS IS USED IN JS, IN ELM WE TRACK SELECTION IN selectedSessionId. REMOVE WHEN MOVING FETCHING FROM JS TO ELM
    }


type alias Model =
    { page : Page
    , key : Maybe Browser.Navigation.Key
    , sessions : List Session
    , selectedSessionId : Maybe Int
    , isHttping : Bool
    , crowdMapResolution : Int
    , isCrowdMapOn : Bool
    , tags : LabelsInput.Model
    , profiles : LabelsInput.Model
    , timeRange : TimeRange
    }


type Page
    = Fixed
    | Mobile



-- TODO: show right page depending on location


defaultModel : Model
defaultModel =
    { page = Mobile
    , key = Nothing
    , sessions = []
    , selectedSessionId = Nothing
    , isHttping = False
    , crowdMapResolution = 25
    , isCrowdMapOn = False
    , tags = LabelsInput.empty
    , profiles = LabelsInput.empty
    , timeRange = TimeRange.defaultTimeRange
    }


init : Flags -> Url -> Browser.Navigation.Key -> ( Model, Cmd Msg )
init flags url key =
    let
        _ =
            Debug.log "url" <| Url.toString url

        page =
            case Url.toString url of
                "http://localhost:3000/mobile_map" ->
                    Mobile

                "http://localhost:3000/fixed_map" ->
                    Fixed

                _ ->
                    Mobile
    in
    ( { defaultModel
        | page = page
        , key = Just key
        , isCrowdMapOn = flags.isCrowdMapOn
        , crowdMapResolution = flags.crowdMapResolution
        , tags = LabelsInput.init flags.tags
        , profiles = LabelsInput.init flags.profiles
        , timeRange = TimeRange.update defaultModel.timeRange flags.timeRange
      }
    , Cmd.none
    )


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch [ updateSessions UpdateSessions, updateIsHttping UpdateIsHttping ]



---- UPDATE ----


port updateSessions : (List Session -> msg) -> Sub msg


port checkedSession : { deselected : Maybe Int, selected : Maybe Int } -> Cmd msg


port loadMoreSessions : () -> Cmd msg


port updateIsHttping : (Bool -> msg) -> Sub msg


type Msg
    = NoOp
    | UrlChange Url
    | UrlRequest Browser.UrlRequest
    | ToggleSessionSelection Int
    | UpdateSessions (List Session)
    | LoadMoreSessions
    | UpdateIsHttping Bool
    | ToggleCrowdMap
    | UpdateCrowdMapResolution Int
    | TagsLabels LabelsInput.Msg
    | ProfileLabels LabelsInput.Msg
    | UpdateTimeRange Encode.Value


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )

        UrlChange url ->
            case model.key of
                Just key ->
                    ( model, Cmd.none )

                Nothing ->
                    ( model, Cmd.none )

        UrlRequest urlRequest ->
            case urlRequest of
                Internal url ->
                    --TODO: case key
                    case model.key of
                        Just key ->
                            ( model, Browser.Navigation.load (Url.toString url) )

                        --TODO: ( model, Browser.Navigation.pushUrl key (Url.toString url) )
                        Nothing ->
                            ( model, Cmd.none )

                External url ->
                    ( model, Browser.Navigation.load url )

        ToggleSessionSelection id ->
            if model.selectedSessionId == Just id then
                ( { model | selectedSessionId = Nothing }
                , checkedSession { deselected = model.selectedSessionId, selected = Nothing }
                )

            else
                ( { model | selectedSessionId = Just id }
                , checkedSession { deselected = model.selectedSessionId, selected = Just id }
                )

        UpdateSessions sessions ->
            let
                selectedSessionId =
                    List.head << List.map .id << List.filter .selected
            in
            ( { model | sessions = sessions, selectedSessionId = selectedSessionId sessions }, Cmd.none )

        LoadMoreSessions ->
            ( model, loadMoreSessions () )

        UpdateIsHttping isHttpingNow ->
            ( { model | isHttping = isHttpingNow }, Cmd.none )

        ToggleCrowdMap ->
            ( { model | isCrowdMapOn = not model.isCrowdMapOn }, Ports.toggleCrowdMap () )

        UpdateCrowdMapResolution resolution ->
            ( { model | crowdMapResolution = resolution }, Ports.updateResolution resolution )

        TagsLabels subMsg ->
            updateLabels subMsg model.tags Ports.updateTags TagsLabels (\tags -> { model | tags = tags })

        ProfileLabels subMsg ->
            updateLabels subMsg model.profiles Ports.updateProfiles ProfileLabels (\profiles -> { model | profiles = profiles })

        UpdateTimeRange value ->
            let
                newTimeRange =
                    TimeRange.update model.timeRange value
            in
            ( { model | timeRange = newTimeRange }, Cmd.none )


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



-- VIEW


viewDocument : Model -> Browser.Document Msg
viewDocument model =
    { title = "AirCasting"
    , body = [ view model ]
    }


view : Model -> Html Msg
view model =
    div [ Attr.id "elm-app" ]
        [ nav []
            [ ul []
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
            --[ Attr.attribute "ng-controller" "MobileSessionsMapCtrl" ]
            []
            [ div [ Attr.class "maps-page-container" ]
                [ div [ Attr.class "map-filters" ]
                    [ viewSessionTypes model
                    , viewFilters model
                    , div [ Attr.class "filters-buttons" ]
                        [ button [ Attr.class "filters-button export-button", Attr.id "copy-link-tooltip" ]
                            [ text "export session" ]
                        , button [ Attr.class "filters-button circular-button", Attr.id "copy-link-tooltip" ]
                            [ text "o" ]
                        ]
                    ]
                , div [ Attr.class "maps-content-container" ]
                    [ if model.isHttping then
                        div [ Attr.class "overlay" ]
                            [ div [ Attr.class "lds-dual-ring" ] []
                            ]

                      else
                        text ""
                    , div [ Attr.class "map-container" ]
                        [ div [ Attr.class "map", Attr.id "map11", Attr.attribute "ng-controller" "MapCtrl", Attr.attribute "googlemap" "" ]
                            []
                        , div [ Attr.attribute "ng-controller" "MobileSessionsMapCtrl" ]
                            [ div [ Attr.class "sessions", Attr.attribute "ng-controller" "SessionsGraphCtrl" ]
                                (case model.selectedSessionId of
                                    Nothing ->
                                        [ h2 [ Attr.class "sessions-header" ]
                                            [ text "Sessions" ]
                                        , span [ Attr.class "sessions-number" ]
                                            [ text "showing 6 of 500 reuslts" ]
                                        , viewSessions model
                                        ]

                                    Just _ ->
                                        [ div [ Attr.id "graph-top" ]
                                            [ div [ Attr.id "graph-header" ] [ text "Sessions Graph" ]
                                            , a [ Attr.id "graph-arrow" ] []
                                            ]
                                        , div
                                            [ Attr.id "graph-box" ]
                                            [ div [ Attr.id "graph" ] []
                                            ]
                                        ]
                                )
                            ]
                        ]
                    , div [ Attr.class "heatmap" ]
                        [ text "A place for heatmap    " ]
                    ]
                ]
            ]
        ]


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
    div [ Attr.class "sessions-container", Attr.attribute "ng-controller" "SessionsListCtrl" ]
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
        [ Attr.style "padding" "5px 10px"
        , Attr.style "clear" "both"
        , Attr.style "overflow" "hidden"
        , Events.onClick <| ToggleSessionSelection session.id
        ]
        [ input
            [ Attr.type_ "radio"
            , Attr.id <| "radio-" ++ fromInt session.id
            , Attr.checked <| selectedSessionId == Just session.id
            , Attr.style "float" "left"
            , Attr.style "margin" "3px 0 0"
            ]
            []
        , dl
            [ Attr.style "float" "left"
            , Attr.style "margin" "0 0 0 10px"
            ]
            [ dt
                [ Attr.style "font-size" "14px"
                , Attr.style "color" "#000"
                , Attr.style "font-weight" "normal"
                ]
                [ label
                    [ Attr.class "narrow"
                    , Attr.style "display" "block"
                    , Attr.style "cursor" "pointer"
                    , Attr.style "width" "170px"
                    ]
                    [ text session.title ]
                ]
            , dd
                [ Attr.style "font-size" "11px"
                , Attr.style "margin" "0"
                , Attr.style "color" "#000"
                , Attr.style "font-weight" "normal"
                ]
                [ label
                    [ Attr.class "narrow"
                    , Attr.style "display" "block"
                    , Attr.style "cursor" "pointer"
                    , Attr.style "width" "170px"
                    ]
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
            viewFixedFilters


viewMobileFilters : Model -> Html Msg
viewMobileFilters model =
    form [ Attr.class "filters-form" ]
        [ label [ Attr.for "parameter" ]
            [ text "parameter:" ]
        , input [ Attr.class "input-dark input-filters ", Attr.id "parameter", Attr.name "user_name", Attr.placeholder "particulate matter", Attr.type_ "text" ]
            []
        , label [ Attr.for "sensor" ]
            [ text "sensor:" ]
        , input [ Attr.class "input-dark input-filters ", Attr.id "sensor", Attr.name "user_name", Attr.placeholder "sensor", Attr.type_ "text" ]
            []
        , label [ Attr.for "location" ]
            [ text "location:" ]
        , input [ Attr.class "input-dark input-filters ", Attr.id "location", Attr.name "user_name", Attr.placeholder "location", Attr.type_ "text" ]
            []
        , label [ Attr.for "time-frame" ]
            [ text "time frame:" ]
        , input [ Attr.class "input-dark input-filters ", Attr.id "daterange", Attr.name "user_name", Attr.placeholder "time frame", Attr.type_ "time-frame" ]
            []
        , label [ Attr.for "profile-names" ]
            [ text "profile names:" ]
        , input [ Attr.class "input-dark input-filters ", Attr.id "profiles-search", Attr.name "user_name", Attr.placeholder "+ add profile name", Attr.type_ "text" ]
            [ Html.map ProfileLabels <| LabelsInput.view model.profiles "Profile Names" "profiles-search" ]
        , label [ Attr.for "parameter" ]
            [ text "tags:" ]
        , input [ Attr.class "input-dark input-filters ", Attr.id "tags-search", Attr.name "user_name", Attr.placeholder "+ add tag", Attr.type_ "text" ]
            [ Html.map TagsLabels <| LabelsInput.view model.tags "Tags" "tags-search" ]
        , div [ Attr.class "filter-separator" ]
            []
        , input [ Attr.name "CrowdMap", Attr.type_ "checkbox", Attr.value "CrowdMap", Attr.checked model.isCrowdMapOn, Events.onClick ToggleCrowdMap ]
            []
        , label [ Attr.for "CrowdMap" ]
            [ text "CrowdMap" ]
        , div [ Attr.id "crowd-map-slider" ]
            [ p []
                [ text "Resolution" ]
            , div []
                [ input
                    [ Attr.class "crowd-map-slider"
                    , onChange (String.toInt >> Maybe.withDefault 25 >> UpdateCrowdMapResolution)
                    , Attr.value (String.fromInt model.crowdMapResolution)
                    , Attr.max "50"
                    , Attr.min "10"
                    , Attr.type_ "range"
                    ]
                    []
                , span []
                    [ text <| String.fromInt model.crowdMapResolution ]
                ]
            ]
        ]


onChange : (String -> msg) -> Html.Attribute msg
onChange tagger =
    Events.on "change" (Decode.map tagger Events.targetValue)


viewFixedFilters : Html Msg
viewFixedFilters =
    form [ Attr.class "filters-form" ] [ text "fixed" ]



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

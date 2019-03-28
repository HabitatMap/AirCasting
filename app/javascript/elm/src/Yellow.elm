module Yellow exposing (Flags, Model, Msg(..), init, main, update, view)

import Browser exposing (..)
import Browser.Navigation
import Html exposing (Html, a, button, div, form, h2, h3, h4, input, label, li, main_, nav, p, span, text, ul)
import Html.Attributes as Attr
import Html.Events as Events
import Json.Decode as Decode
import Json.Encode as Encode
import LabelsInput
import Maybe exposing (..)
import Ports
import TimeRange exposing (TimeRange)
import Url exposing (Url)



---- MODEL ----


type alias Flags =
    {}


type alias Model =
    { page : Page
    , key : Maybe Browser.Navigation.Key
    }


type Page
    = Fixed
    | Mobile



-- TODO: show right page depending on location


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
    ( { page = page, key = Just key }, Cmd.none )



---- UPDATE ----


type Msg
    = NoOp
    | UrlChange Url
    | UrlRequest Browser.UrlRequest


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



-- VIEW


viewDocument : Model -> Browser.Document Msg
viewDocument model =
    { title = "AirCasting"
    , body = [ view model ]
    }


view : Model -> Html Msg
view model =
    div []
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
                    [ div [ Attr.class "map-container" ]
                        [ div [ Attr.class "map", Attr.id "map1" ]
                            []
                        , div [ Attr.class "sessions" ]
                            [ h2 [ Attr.class "sessions-header" ]
                                [ text "Sessions" ]
                            , span [ Attr.class "sessions-number" ]
                                [ text "showing 6 of 500 reuslts" ]
                            , div [ Attr.class "sessions-container" ] (List.repeat 9 viewSessionCard)
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


viewSessionCard : Html Msg
viewSessionCard =
    div [ Attr.class "session" ]
        [ div [ Attr.class "session-header-container" ]
            [ div [ Attr.class "session-color heat-lvl1-bg" ]
                []
            , h3 [ Attr.class "session-name" ]
                [ text "Lunar HQ" ]
            ]
        , p [ Attr.class "session-owner" ]
            [ text "Lunar team" ]
        , p [ Attr.class "session-dates" ]
            [ text "12.02.2019 13:00-15:30" ]
        ]


viewFilters : Model -> Html Msg
viewFilters model =
    case model.page of
        Mobile ->
            viewMobileFilters

        Fixed ->
            viewFixedFilters


viewMobileFilters : Html Msg
viewMobileFilters =
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
        , input [ Attr.class "input-dark input-filters ", Attr.id "parameter", Attr.name "user_name", Attr.placeholder "time frame", Attr.type_ "time-frame" ]
            []
        , label [ Attr.for "profile-names" ]
            [ text "profile names:" ]
        , input [ Attr.class "input-dark input-filters ", Attr.id "profile-names", Attr.name "user_name", Attr.placeholder "+ add profile name", Attr.type_ "text" ]
            []
        , label [ Attr.for "parameter" ]
            [ text "tags:" ]
        , input [ Attr.class "input-dark input-filters ", Attr.id "tag", Attr.name "user_name", Attr.placeholder "+ add tag", Attr.type_ "text" ]
            []
        , div [ Attr.class "filter-separator" ]
            []
        , input [ Attr.name "CrowdMap", Attr.type_ "checkbox", Attr.value "CrowdMap" ]
            []
        , label [ Attr.for "CrowdMap" ]
            [ text "CrowdMap" ]
        ]


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
        , subscriptions = always Sub.none
        , onUrlRequest = UrlRequest
        , onUrlChange = UrlChange
        }

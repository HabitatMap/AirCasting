port module SessionsList exposing (Model, Msg(..), Session, ShortType, checkedSession, init, loadMoreSessions, main, subscriptions, update, updateSessions, view, viewSession, viewShortType)

import Browser
import Html exposing (Html, button, dd, div, dl, dt, input, label, li, span, text, ul)
import Html.Attributes as Attr
import Html.Events as Events
import String exposing (fromInt)



---- MODEL ----


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
    { sessions : List Session
    , selectedSessionId : Maybe Int
    }


init : List Session -> ( Model, Cmd Msg )
init flags =
    ( { sessions = flags, selectedSessionId = Nothing }, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch [ updateSessions UpdateSessions ]



---- UPDATE ----


port updateSessions : (List Session -> msg) -> Sub msg


port checkedSession : { deselected : Maybe Int, selected : Maybe Int } -> Cmd msg


port loadMoreSessions : () -> Cmd msg


type Msg
    = ToggleSessionSelection Int
    | UpdateSessions (List Session)
    | LoadMoreSessions


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
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



---- VIEW ----


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


view : Model -> Html Msg
view model =
    ul
        []
        (List.map (viewSession model.selectedSessionId) model.sessions
            ++ [ viewLoadMore <| List.length model.sessions ]
        )


viewLoadMore : Int -> Html Msg
viewLoadMore sessionCount =
    if sessionCount /= 0 && modBy 50 sessionCount == 0 then
        li [] [ button [ Events.onClick LoadMoreSessions ] [ text "Load More..." ] ]

    else
        text ""



---- PROGRAM ----


main : Program (List Session) Model Msg
main =
    Browser.element
        { view = view
        , init = init
        , update = update
        , subscriptions = subscriptions
        }

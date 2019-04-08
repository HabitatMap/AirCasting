module LabelsInput exposing (Model, Msg(..), empty, fromList, init, subscriptions, update, view, withCandidate)

import Html exposing (Html, button, div, h4, input, label, text)
import Html.Attributes as Attr
import Html.Events as Events
import Html.Events.Extra as ExtraEvents
import Set exposing (Set)


type Model
    = Model
        { candidate : String
        , labels : Set String
        }



-- INIT


empty : Model
empty =
    fromList []


init : List String -> Model
init =
    fromList


subscriptions : ((String -> Msg) -> Sub msg) -> Sub msg
subscriptions toSub =
    Sub.batch [ toSub Add ]



-- UPDATE


type Msg
    = UpdateCandidate String
    | Add String
    | Remove String


update : Msg -> Model -> (List String -> Cmd msg) -> ( Model, Cmd msg )
update msg model toCmd =
    case msg of
        UpdateCandidate str ->
            ( withCandidate str model, Cmd.none )

        Add str ->
            let
                newModel =
                    add str model
            in
            ( newModel, toCmd (asList newModel) )

        Remove str ->
            let
                newModel =
                    remove str model
            in
            ( newModel, toCmd (asList newModel) )



-- VIEW


view : Model -> String -> String -> String -> Bool -> Html Msg
view model text_ inputId placeholder isDisabled =
    div []
        [ label [ Attr.for inputId ] [ text text_ ]
        , div [ Attr.class "tag-container" ]
            [ input
                [ Attr.id inputId
                , Attr.class "input-dark"
                , Attr.class "input-filters"
                , Attr.class "input-filters-tag"
                , Attr.placeholder placeholder
                , Attr.type_ "text"
                , Attr.name inputId
                , ExtraEvents.onEnter (Add <| getCandidate model)
                , Events.onInput UpdateCandidate
                , Attr.value <| getCandidate model
                , Attr.disabled isDisabled
                ]
                []
            , div [] (List.map viewLabel <| asList model)
            ]
        ]


viewLabel : String -> Html Msg
viewLabel label =
    div [ Attr.class "filters-tag" ]
        [ text label
        , button
            [ Attr.id label
            , Attr.class "filters-tag-close"
            , Events.onClick <| Remove label
            ]
            []
        ]



-- UTILS


asList : Model -> List String
asList (Model { labels }) =
    Set.toList labels


add : String -> Model -> Model
add label (Model model) =
    Model { model | labels = Set.insert label model.labels, candidate = "" }


remove : String -> Model -> Model
remove label (Model model) =
    Model { model | labels = Set.remove label model.labels }


fromList : List String -> Model
fromList labels =
    Model { labels = Set.fromList labels, candidate = "" }


getCandidate : Model -> String
getCandidate (Model { candidate }) =
    candidate


withCandidate : String -> Model -> Model
withCandidate candidate (Model model) =
    Model { model | candidate = candidate }

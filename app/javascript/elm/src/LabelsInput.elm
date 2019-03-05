module LabelsInput exposing (Model, Msg(..), empty, fromList, init, subscriptions, update, view, withCandidate)

import Html exposing (Html, button, div, h4, input, text)
import Html.Attributes as Attr
import Html.Events as Events
import Html.Events.Extra as ExtraEvents
import Ports
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


view : Model -> String -> String -> Html Msg
view model description inputId =
    div []
        [ h4 []
            [ text description
            ]
        , input
            [ Attr.id inputId
            , ExtraEvents.onEnter (Add <| getCandidate model)
            , Attr.class "filters-input"
            , Events.onInput UpdateCandidate
            , Attr.value <| getCandidate model
            ]
            []
        , div [] (List.map viewLabel <| asList model)
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

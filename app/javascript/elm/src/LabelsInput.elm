module LabelsInput exposing (Model, Msg(..), empty, fromList, init, subscriptions, update, view, withCandidate)

import Html exposing (Html, button, div, input, label, text)
import Html.Attributes exposing (class, disabled, for, id, name, placeholder, type_, value)
import Html.Events as Events
import Html.Events.Extra as ExtraEvents
import Set exposing (Set)
import Tooltip exposing (TooltipText)


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
            case str of
                "" ->
                    ( model, Cmd.none )

                _ ->
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


view : Model -> String -> String -> String -> String -> Bool -> TooltipText -> Html Msg
view model text_ inputId jsClass placeholderText isDisabled tooltipText =
    div [ class "filters__input-group" ]
        [ div [ class "tag-container" ] (List.map viewLabel <| asList model)
        , input
            [ id inputId
            , class (String.append jsClass " input input--dark input--filters")
            , placeholder placeholderText
            , type_ "text"
            , name inputId
            , ExtraEvents.onEnter (Add <| getCandidate model)
            , Events.onInput UpdateCandidate
            , value <| getCandidate model
            , disabled isDisabled
            ]
            []
        , label [ class "label label--filters", for inputId ] [ text text_ ]
        , Tooltip.view tooltipText
        , div [ class "autocomplete-spinner" ] []
        ]


viewLabel : String -> Html Msg
viewLabel label =
    div [ class "tag" ]
        [ text label
        , button
            [ id label
            , class "tag-close"
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

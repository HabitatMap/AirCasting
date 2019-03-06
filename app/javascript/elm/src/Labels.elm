module Labels exposing (Labels, add, addLabel, empty, fromList, removeLabel, updateCandidate, viewLabels)

import Html exposing (Html, button, div, h4, input, text)
import Html.Attributes as Attr
import Html.Events as Events
import Html.Events.Extra as ExtraEvents
import Set exposing (Set)


type Labels
    = Labels
        { candidate : String
        , collection : Set String
        }


empty : Labels
empty =
    Labels
        { candidate = emptyCandidate
        , collection = Set.empty
        }


asList : Labels -> List String
asList (Labels { collection }) =
    Set.toList collection


fromList : List String -> Labels
fromList newCollection =
    Labels { collection = Set.fromList newCollection, candidate = emptyCandidate }


add : Labels -> String -> Labels
add (Labels labels) new =
    Labels { labels | collection = Set.insert new labels.collection, candidate = emptyCandidate }


remove : Labels -> String -> Labels
remove (Labels labels) new =
    Labels { labels | collection = Set.remove new labels.collection }


getCandidate : Labels -> String
getCandidate (Labels { candidate }) =
    candidate


updateCandidate : Labels -> String -> Labels
updateCandidate (Labels labels) newCandidate =
    Labels { labels | candidate = newCandidate }


emptyCandidate : String
emptyCandidate =
    ""


viewLabels : Labels -> String -> String -> (String -> msg) -> (String -> msg) -> (String -> msg) -> Html msg
viewLabels labels description inputId updateSearchMsg removeLabelMsg addLabelMsg =
    div []
        [ h4 []
            [ text description
            ]
        , input
            [ Attr.id inputId
            , ExtraEvents.onEnter (addLabelMsg (getCandidate labels))
            , Attr.class "filters-input"
            , Events.onInput updateSearchMsg
            , Attr.value <| getCandidate labels
            ]
            []
        , div [] (List.map (viewLabel removeLabelMsg) (asList labels))
        ]


viewLabel : (String -> msg) -> String -> Html msg
viewLabel msg label =
    div [ Attr.class "filters-tag" ]
        [ text label
        , button
            [ Attr.id label
            , Attr.class "filters-tag-close"
            , Events.onClick (msg label)
            ]
            []
        ]


removeLabel : String -> Labels -> (Labels -> model) -> (List String -> Cmd a) -> ( model, Cmd a )
removeLabel labelToRemove labels updateLabels toCmd =
    let
        newLabels =
            remove labels labelToRemove
    in
    ( updateLabels newLabels, toCmd (asList newLabels) )


addLabel : String -> Labels -> (Labels -> model) -> (List String -> Cmd a) -> ( model, Cmd a )
addLabel newLabel labels updateLabels toCmd =
    let
        newLabels =
            add labels newLabel
    in
    ( updateLabels newLabels, toCmd (asList newLabels) )

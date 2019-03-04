module Labels exposing (Labels, add, asList, empty, fromList, getCandidate, remove, updateCandidate, viewLabels)

import Html exposing (Html, button, div, h4, input, label, p, span, text)
import Html.Attributes as Attr
import Html.Events as Events
import Set exposing (Set)


type Labels
    = Labels
        { candidate : String
        , collection : Set String
        }


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


viewLabels : Labels -> String -> String -> String -> (String -> msg) -> (String -> msg) -> Html msg
viewLabels labels description testId inputId updateSearchMsg removeLabelMsg =
    div [ Attr.id testId ]
        [ h4 []
            [ text description
            ]
        , input
            [ Attr.id inputId
            , Attr.class "filters-input"
            , Events.onInput updateSearchMsg
            , Attr.value <| getCandidate labels
            ]
            []
        , div [] (List.map (viewLabel removeLabelMsg) (asList labels))
        ]


viewLabel : (String -> msg) -> String -> Html msg
viewLabel msg profile =
    div [ Attr.class "filters-tag" ]
        [ text profile
        , button
            [ Attr.id profile
            , Attr.class "filters-tag-close"
            , Events.onClick (msg profile)
            ]
            []
        ]

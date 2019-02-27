module Labels exposing (Labels, add, asList, empty, fromList, getCandidate, remove, updateCandidate)

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

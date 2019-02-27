module Aaa exposing (Bbb, addToCollection, default, getCollection, getCurrentInput, removeFromCollection, updateCurrent)

import Set


type Bbb
    = Bbb
        { currentInput : String
        , collection : Set.Set String
        }


default =
    Bbb
        { currentInput = ""
        , collection = Set.empty
        }


updateCurrent : Bbb -> String -> Bbb
updateCurrent bbb newCurrent =
    case bbb of
        Bbb ccc ->
            Bbb { ccc | currentInput = newCurrent }


addToCollection : Bbb -> String -> Bbb
addToCollection bbb new =
    case bbb of
        Bbb ccc ->
            Bbb { ccc | collection = Set.insert new ccc.collection }


removeFromCollection : Bbb -> String -> Bbb
removeFromCollection bbb new =
    case bbb of
        Bbb ccc ->
            Bbb { ccc | collection = Set.remove new ccc.collection }


getCollection : Bbb -> List String
getCollection bbb =
    case bbb of
        Bbb ccc ->
            Set.toList ccc.collection


getCurrentInput : Bbb -> String
getCurrentInput bbb =
    case bbb of
        Bbb ccc ->
            ccc.currentInput

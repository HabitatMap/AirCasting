port module Ports exposing
    ( checkedSession
    , findLocation
    , loadMoreSessions
    , locationCleared
    , profileSelected
    , selectParameter
    , showCopyLinkTooltip
    , tagSelected
    , timeRangeSelected
    , toggleCrowdMap
    , updateIsHttping
    , updateProfiles
    , updateResolution
    , updateSessions
    , updateTags
    )

import Data.Session exposing (..)
import Json.Encode as Encode


port tagSelected : (String -> msg) -> Sub msg


port profileSelected : (String -> msg) -> Sub msg


port timeRangeSelected : (Encode.Value -> msg) -> Sub msg


port locationCleared : (() -> msg) -> Sub msg


port toggleCrowdMap : Bool -> Cmd a


port updateResolution : Int -> Cmd a


port updateTags : List String -> Cmd a


port updateProfiles : List String -> Cmd a


port showCopyLinkTooltip : () -> Cmd a


port findLocation : String -> Cmd a


port selectParameter : String -> Cmd a


port updateSessions : (List Session -> msg) -> Sub msg


port checkedSession : { deselected : Maybe Int, selected : Maybe Int } -> Cmd msg


port loadMoreSessions : () -> Cmd msg


port updateIsHttping : (Bool -> msg) -> Sub msg

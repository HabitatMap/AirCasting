port module Ports exposing (profileNameSelected, tagSelected, timeRangeSelected, toggleCrowdMap, updateProfiles, updateResolution, updateTags, updateTimeRange)

import Json.Encode as Encode


port tagSelected : (String -> msg) -> Sub msg


port profileNameSelected : (String -> msg) -> Sub msg


port timeRangeSelected : (Encode.Value -> msg) -> Sub msg


port toggleCrowdMap : () -> Cmd a


port updateResolution : Int -> Cmd a


port updateTags : List String -> Cmd a


port updateProfiles : List String -> Cmd a


port updateTimeRange : Encode.Value -> Cmd a

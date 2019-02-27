port module Ports exposing (profileNameSelected, tagSelected, toggleCrowdMap, updateProfiles, updateResolutionPort, updateTags)


port tagSelected : (String -> msg) -> Sub msg


port profileNameSelected : (String -> msg) -> Sub msg


port toggleCrowdMap : () -> Cmd a


port updateResolutionPort : Int -> Cmd a


port updateTags : List String -> Cmd a


port updateProfiles : List String -> Cmd a

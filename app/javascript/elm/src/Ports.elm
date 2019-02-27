port module Ports exposing (tagSelected, toggleCrowdMap, updateResolutionPort, updateTags)


port tagSelected : (String -> msg) -> Sub msg


port toggleCrowdMap : () -> Cmd a


port updateResolutionPort : Int -> Cmd a


port updateTags : List String -> Cmd a

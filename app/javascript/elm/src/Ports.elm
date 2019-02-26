port module Ports exposing (showAutocomplete, tagSelected, toggleCrowdMap, updateResolutionPort, updateTags)


port showAutocomplete : String -> Cmd a


port tagSelected : (String -> msg) -> Sub msg


port toggleCrowdMap : () -> Cmd a


port updateResolutionPort : Int -> Cmd a


port updateTags : List String -> Cmd a

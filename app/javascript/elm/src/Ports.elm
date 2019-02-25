port module Ports exposing (tagSelected, updateTagsSearchField)


port updateTagsSearchField : String -> Cmd a


port tagSelected : (String -> msg) -> Sub msg

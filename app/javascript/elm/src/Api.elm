module Api exposing (exportLink, exportPath)


exportPath : String
exportPath =
    "/api/sessions/export.json"


exportLink : String -> List { session | id : Int } -> String
exportLink email sessions =
    let
        query =
            String.join "&" << List.map ((++) "session_ids[]=" << String.fromInt << .id)
    in
    exportPath ++ "?" ++ query sessions ++ "&email=" ++ email

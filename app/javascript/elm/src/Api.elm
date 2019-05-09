module Api exposing (exportLink, exportPath)


exportPath : String
exportPath =
    "/api/sessions/export.json"


exportLink : List { session | id : Int } -> String
exportLink sessions =
    let
        query =
            String.join "&" << List.map ((++) "session_ids[]=" << String.fromInt << .id)
    in
    exportPath ++ "?" ++ query sessions

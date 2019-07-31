module Data.ExportSessions exposing (EmailForm, defaultEmailForm, exportCmd, exportLink, updateErrors, updateFormValue, view)

import Html exposing (Html, button, form, input, text)
import Html.Attributes exposing (class, placeholder, value)
import Html.Events as Events
import Http
import Popup
import Validate exposing (Valid, Validator, fromValid, ifInvalidEmail, validate)


type alias EmailForm =
    { value : String, errors : List String }


defaultEmailForm =
    { value = "", errors = [] }


emailValidator : Validator String EmailForm
emailValidator =
    ifInvalidEmail .value (\_ -> "Please enter a valid email address.")


view : EmailForm -> (Result (List String) (Valid EmailForm) -> msg) -> msg -> (String -> msg) -> Html msg
view model exportSessions noOp updateEmail =
    form [ class "filter-popup" ]
        [ input
            [ placeholder "email"
            , Popup.clickWithoutDefault noOp
            , value model.value
            , Events.onInput updateEmail
            ]
            []
        , button [ Popup.clickWithoutDefault <| exportSessions (validate emailValidator model) ] [ text "Export" ]
        , text (String.join " " model.errors)
        ]


updateFormValue : String -> EmailForm
updateFormValue value =
    { value = value, errors = [] }


updateErrors : EmailForm -> List String -> EmailForm
updateErrors model errors =
    { model | errors = errors }


exportPath : String
exportPath =
    "/api/sessions/export.json"


url : List { session | id : Int } -> Valid EmailForm -> String
url sessions emailForm =
    let
        sessionIds =
            String.join "&" << List.map ((++) "session_ids[]=" << String.fromInt << .id)
    in
    exportPath ++ "?" ++ sessionIds sessions ++ "&" ++ "email=" ++ (fromValid emailForm |> .value)


exportCmd : Valid EmailForm -> List { session | id : Int } -> msg -> Cmd msg
exportCmd emailForm sessions afterRequest =
    Http.get
        { url = url sessions emailForm
        , expect = Http.expectWhatever (\_ -> afterRequest)
        }


exportLink : List { session | id : Int } -> String -> String
exportLink sessions email =
    let
        query =
            String.join "&" << List.map ((++) "session_ids[]=" << String.fromInt << .id)
    in
    exportPath ++ "?" ++ query sessions ++ "&" ++ "email=" ++ email

module Data.EmailForm exposing (EmailForm, defaultEmailForm, toEmail, updateErrors, updateFormValue, view)

import Html exposing (Html, button, form, input, text)
import Html.Attributes exposing (class, placeholder, value)
import Html.Events as Events
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
view emailForm onSubmit noOp updateValue =
    form [ class "filter-popup" ]
        [ input
            [ placeholder "email"
            , Popup.clickWithoutDefault noOp
            , value emailForm.value
            , Events.onInput updateValue
            ]
            []
        , button [ Popup.clickWithoutDefault <| onSubmit (validate emailValidator emailForm) ] [ text "export" ]
        , text (String.join " " emailForm.errors)
        ]


updateFormValue : String -> EmailForm
updateFormValue value =
    { value = value, errors = [] }


updateErrors : EmailForm -> List String -> EmailForm
updateErrors emailForm errors =
    { emailForm | errors = errors }


toEmail : Valid EmailForm -> String
toEmail emailForm =
    fromValid emailForm |> .value

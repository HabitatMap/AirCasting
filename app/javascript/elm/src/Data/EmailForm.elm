module Data.EmailForm exposing (EmailForm, addFlashMessage, clearFlash, defaultEmailForm, toEmail, updateErrors, updateFormValue, view)

import Html exposing (Html, button, div, form, input, p, text)
import Html.Attributes exposing (attribute, class, placeholder, value)
import Html.Events as Events
import Popup
import Validate exposing (Valid, Validator, fromValid, ifInvalidEmail, validate)


type alias EmailForm =
    { value : String, errors : List String, flash : Maybe String }


defaultEmailForm =
    { value = "", errors = [], flash = Nothing }


emailValidator : Validator String EmailForm
emailValidator =
    ifInvalidEmail .value (\_ -> "Please enter a valid email address.")


view : EmailForm -> (Result (List String) (Valid EmailForm) -> msg) -> msg -> (String -> msg) -> Html msg
view emailForm onSubmit noOp updateValue =
    form [ class "email-popup tippy-box tippy-content", attribute "data-theme" "light-border" ]
        [ case emailForm.flash of
            Just flashMessage ->
                text flashMessage

            Nothing ->
                div []
                    [ input
                        [ class "input email-popup__input"
                        , placeholder "email address"
                        , Popup.clickWithoutDefault noOp
                        , value emailForm.value
                        , Events.onInput updateValue
                        ]
                        []
                    , if emailForm.errors == [] then
                        text ""

                      else
                        p [ class "email-popup__error-message" ] [ text (String.join " " emailForm.errors) ]
                    , button
                        [ class "button button--primary email-popup__button"
                        , Popup.clickWithoutDefault <| onSubmit (validate emailValidator emailForm)
                        ]
                        [ text "export" ]
                    ]
        ]


updateFormValue : String -> EmailForm
updateFormValue value =
    { value = value, errors = [], flash = Nothing }


updateErrors : EmailForm -> List String -> EmailForm
updateErrors emailForm errors =
    { emailForm | errors = errors }


toEmail : Valid EmailForm -> String
toEmail emailForm =
    fromValid emailForm |> .value


addFlashMessage : EmailForm -> String -> EmailForm
addFlashMessage emailForm flashMessage =
    { emailForm | flash = Just flashMessage }


clearFlash : EmailForm -> EmailForm
clearFlash emailForm =
    { emailForm | flash = Nothing }

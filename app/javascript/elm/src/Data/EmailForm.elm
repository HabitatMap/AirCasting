module Data.EmailForm exposing (EmailForm, defaultEmailForm, toEmail, updateErrors, updateFormValue, view, addFlash)

import Html exposing (Html, button, form, input, p, text, div)
import Html.Attributes exposing (class, placeholder, value)
import Html.Events as Events
import Popup
import Validate exposing (Valid, Validator, fromValid, ifInvalidEmail, validate)


type alias EmailForm =
    { value : String, errors : List String, flash : Maybe String}


defaultEmailForm =
    { value = "", errors = [], flash = Nothing }


emailValidator : Validator String EmailForm
emailValidator =
    ifInvalidEmail .value (\_ -> "Please enter a valid email address.")


view : EmailForm -> (Result (List String) (Valid EmailForm) -> msg) -> msg -> (String -> msg) -> Html msg
view emailForm onSubmit noOp updateValue =
    form [ class "tippy-tooltip light-border-theme email-popup" ]
       [ case emailForm.flash of
          Just flashMessage ->
            text flashMessage
          Nothing ->
              div [] 
              [ input
                [ class "email-popup__input"
                , placeholder "email"
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
    { value = value, errors = [], flash = Nothing}


updateErrors : EmailForm -> List String -> EmailForm
updateErrors emailForm errors =
    { emailForm | errors = errors }


toEmail : Valid EmailForm -> String
toEmail emailForm =
    fromValid emailForm |> .value

addFlash : EmailForm -> String -> EmailForm
addFlash emailForm flashMessage =
  {emailForm | flash = Just flashMessage }

module LocationFilter exposing (view)

import Html exposing (Html, div, h4, input, text)
import Html.Attributes as Attr
import Html.Events as Events
import Json.Decode as Decode


onEnter : msg -> Html.Attribute msg
onEnter msg =
    let
        isEnter code =
            if code == 13 then
                Decode.succeed msg

            else
                Decode.fail "not ENTER"
    in
    Events.on "keydown" (Decode.andThen isEnter Events.keyCode)


view : String -> (String -> msg) -> msg -> Html msg
view location update submit =
    div []
        [ h4 [] [ text "Location" ]
        , input
            [ Attr.id "location-filter"
            , Attr.value location
            , Events.onInput update
            , onEnter submit
            ]
            []
        ]

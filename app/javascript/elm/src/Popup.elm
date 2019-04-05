module Popup exposing (Items, Popup(..), clickWithoutDefault, view)

import Html exposing (Html, button, div, li, text, ul)
import Html.Attributes as Attr
import Html.Events as Events
import Json.Decode as Decode


type Popup
    = ExpandableSelectFrom Items String
    | SelectFrom (List String)
    | None


type alias Items =
    { main : List String
    , others : List String
    }


view : msg -> (String -> msg) -> Bool -> Popup -> Html msg
view toggle onSelect isPopupExtended popup =
    case popup of
        ExpandableSelectFrom items itemType ->
            div [ Attr.id "popup" ]
                [ selectableItems items.main onSelect
                , if List.isEmpty items.others then
                    text ""

                  else if isPopupExtended then
                    div []
                        [ selectableItems items.others onSelect
                        , togglePopupStateButton ("less " ++ itemType) toggle
                        ]

                  else
                    togglePopupStateButton ("more " ++ itemType) toggle
                ]

        SelectFrom items ->
            selectableItems items onSelect

        None ->
            text ""


togglePopupStateButton : String -> msg -> Html msg
togglePopupStateButton name toggle =
    button
        [ Attr.id "toggle-popup-button"
        , clickWithoutDefault toggle
        ]
        [ text name ]


selectableItems : List String -> (String -> msg) -> Html msg
selectableItems items onSelect =
    items
        |> List.map (\item -> li [] [ button [ Events.onClick (onSelect item) ] [ text item ] ])
        |> ul []


clickWithoutDefault : msg -> Html.Attribute msg
clickWithoutDefault msg =
    Events.custom "click" (Decode.map preventDefault (Decode.succeed msg))


preventDefault : msg -> { message : msg, stopPropagation : Bool, preventDefault : Bool }
preventDefault msg =
    { message = msg
    , stopPropagation = True
    , preventDefault = True
    }

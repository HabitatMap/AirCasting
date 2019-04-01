module Popup exposing (Items, Popup(..), clickWithoutDefault, viewPopup)

import Html exposing (Html, button, div, li, text, ul)
import Html.Attributes as Attr
import Html.Events as Events
import Json.Decode as Decode


type Popup
    = SelectFromItems Items
    | None


type alias Items =
    { main : List String
    , other : Maybe (List String)
    }


viewPopup : msg -> (String -> msg) -> Bool -> Popup -> Html msg
viewPopup toggle onSelect isPopupExtended popup =
    case popup of
        SelectFromItems items ->
            div [ Attr.id "popup" ]
                [ selectableItems items.main onSelect
                , case items.other of
                    Just moreItems ->
                        if isPopupExtended then
                            div []
                                [ selectableItems moreItems onSelect
                                , togglePopupStateButton "less parameters" toggle
                                ]

                        else
                            togglePopupStateButton "more parameters" toggle

                    Nothing ->
                        text ""
                ]

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

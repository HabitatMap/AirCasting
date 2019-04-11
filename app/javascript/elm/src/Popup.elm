module Popup exposing (Popup(..), clickWithoutDefault, view)

import Html exposing (Html, button, div, li, text, ul)
import Html.Attributes as Attr
import Html.Events as Events
import Json.Decode as Decode


type Popup
    = SelectFrom ( List String, List String ) String
    | None


type PopupPart
    = MainPart
    | OtherPart


view : msg -> (String -> msg) -> Bool -> Popup -> Html msg
view toggle onSelect isPopupExtended popup =
    case popup of
        SelectFrom ( main, others ) itemType ->
            case ( List.isEmpty main, List.isEmpty others ) of
                ( True, _ ) ->
                    div [ Attr.id "popup", Attr.class "parameter-filters-popup" ]
                        [ selectableItems MainPart others onSelect ]

                ( False, True ) ->
                    div [ Attr.id "popup", Attr.class "parameter-filters-popup" ]
                        [ selectableItems MainPart main onSelect
                        ]

                ( False, False ) ->
                    div [ Attr.id "popup", Attr.class "parameter-filters-popup" ]
                        [ selectableItems MainPart main onSelect
                        , if List.isEmpty others then
                            text ""

                          else if isPopupExtended then
                            div [ Attr.class "parameter-more-container" ]
                                [ selectableItems OtherPart others onSelect
                                , togglePopupStateButton ("less " ++ itemType) toggle
                                ]

                          else
                            togglePopupStateButton ("more " ++ itemType) toggle
                        ]

        None ->
            text ""


togglePopupStateButton : String -> msg -> Html msg
togglePopupStateButton name toggle =
    button
        [ Attr.id "toggle-popup-button"
        , Attr.class "parameters-toggle-open"
        , clickWithoutDefault toggle
        ]
        [ text name ]


selectableItems : PopupPart -> List String -> (String -> msg) -> Html msg
selectableItems part items onSelect =
    let
        ( parentClass, childClass ) =
            case part of
                MainPart ->
                    ( "parameter-filters-buttons-container", "parameter-filters-button" )

                OtherPart ->
                    ( "parameter-more-list", "more-parameters-link" )
    in
    items
        |> List.map (\item -> button [ Events.onClick (onSelect item), Attr.class childClass, Attr.class "test-parameter-filters-button" ] [ text item ])
        |> div [ Attr.class parentClass ]


clickWithoutDefault : msg -> Html.Attribute msg
clickWithoutDefault msg =
    Events.custom "click" (Decode.map preventDefault (Decode.succeed msg))


preventDefault : msg -> { message : msg, stopPropagation : Bool, preventDefault : Bool }
preventDefault msg =
    { message = msg
    , stopPropagation = True
    , preventDefault = True
    }

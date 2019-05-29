module Popup exposing (Popup(..), clickWithoutDefault, view)

import Html exposing (Html, button, div, li, text, ul)
import Html.Attributes exposing (class, classList, id)
import Html.Events as Events
import Json.Decode as Decode


type Popup
    = SelectFrom ( List String, List String ) String String
    | None


type PopupPart
    = MainPart
    | OtherPart


view : msg -> (String -> msg) -> Bool -> Popup -> Html msg
view toggle onSelect isPopupExtended popup =
    case popup of
        SelectFrom ( main, others ) itemType selectedItem ->
            case ( List.isEmpty main, List.isEmpty others ) of
                ( True, _ ) ->
                    div [ id "popup", class "filter-popup" ]
                        [ selectableItems MainPart others onSelect selectedItem ]

                ( False, True ) ->
                    div [ id "popup", class "filter-popup" ]
                        [ selectableItems MainPart main onSelect selectedItem
                        ]

                ( False, False ) ->
                    div [ id "popup", class "filter-popup" ]
                        [ selectableItems MainPart main onSelect selectedItem
                        , if List.isEmpty others then
                            text ""

                          else if isPopupExtended then
                            div [ class "filter-popup__more" ]
                                [ selectableItems OtherPart others onSelect selectedItem
                                , togglePopupStateButton ("fewer " ++ itemType) toggle
                                ]

                          else
                            togglePopupStateButton ("more " ++ itemType) toggle
                        ]

        None ->
            text ""


togglePopupStateButton : String -> msg -> Html msg
togglePopupStateButton name toggle =
    button
        [ id "toggle-popup-button"
        , class "filter-popup__toggle-more-button"
        , clickWithoutDefault toggle
        ]
        [ text name ]


selectableItems : PopupPart -> List String -> (String -> msg) -> String -> Html msg
selectableItems part items onSelect selectedItem =
    let
        ( parentClass, childClass ) =
            case part of
                MainPart ->
                    ( "filter-popup__list", "button filter-popup-button" )

                OtherPart ->
                    ( "filter-popup__list--more", "button filter-popup-secondary-button" )

        toButton item =
            button
                [ Events.onClick (onSelect item)
                , classList
                    [ ( "active", item == selectedItem )
                    , ( childClass, True )
                    , ( "test-filter-popup-button", True )
                    ]
                ]
                [ text item ]
    in
    div [ class parentClass ] (List.map toButton items)


clickWithoutDefault : msg -> Html.Attribute msg
clickWithoutDefault msg =
    Events.custom "click" (Decode.map preventDefault (Decode.succeed msg))


preventDefault : msg -> { message : msg, stopPropagation : Bool, preventDefault : Bool }
preventDefault msg =
    { message = msg
    , stopPropagation = True
    , preventDefault = True
    }

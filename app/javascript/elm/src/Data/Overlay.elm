module Data.Overlay exposing (Model, Operation(..), Overlay(..), init, none, update, view)

import Html exposing (Html, div, p, text)
import Html.Attributes exposing (class, id)


type Model
    = Overlays (List Overlay)


type Overlay
    = HttpingOverlay
    | IndoorOverlay
    | PopupOverlay
    | TimeFrameOverlay


type Operation
    = AddOverlay Overlay
    | RemoveOverlay Overlay


none : Model
none =
    Overlays []


init : Bool -> Model
init isIndoor =
    if isIndoor then
        Overlays [ IndoorOverlay ]

    else
        none


update : Operation -> Model -> Model
update operation model =
    case ( operation, model ) of
        ( AddOverlay overlay, Overlays overlays ) ->
            Overlays <| overlay :: overlays

        ( RemoveOverlay overlay, Overlays overlays ) ->
            Overlays <| List.filter ((/=) overlay) overlays


view : Model -> Html msg
view (Overlays overlays) =
    case List.head overlays of
        Just overlay ->
            case overlay of
                HttpingOverlay ->
                    div [ class "overlay", id "overlay--httping" ]
                        [ div [ class "spinner" ] []
                        ]

                TimeFrameOverlay ->
                    div [ class "overlay", id "overlay--time-frame" ] []

                PopupOverlay ->
                    div [ class "overlay", id "overlay--popup" ] []

                IndoorOverlay ->
                    div []
                        [ div [ class "overlay overlay--indoor", id "overlay--indoor" ] []
                        , div [ class "overlay-info" ] [ p [] [ text "Indoor sessions aren't mapped." ] ]
                        ]

        Nothing ->
            text ""

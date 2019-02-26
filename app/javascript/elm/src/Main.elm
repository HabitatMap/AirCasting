port module Main exposing (Msg(..), defaultModel, update, view)

import Browser
import Html exposing (Html, button, div, hr, input, label, p, span, text)
import Html.Attributes as Attr
import Html.Events as Events
import Json.Decode
import Ports



---- MODEL ----


type alias Model =
    { crowdMapResolution : Int
    , isCrowdMapOn : Bool
    , tagsSearchFieldContent : String
    , tags : List String
    }


type alias Flags =
    { crowdMapResolution : Int
    , isCrowdMapOn : Bool
    , tags : List String
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { defaultModel
        | isCrowdMapOn = flags.isCrowdMapOn
        , crowdMapResolution = flags.crowdMapResolution
        , tags = flags.tags
      }
    , Cmd.none
    )


defaultModel : Model
defaultModel =
    { crowdMapResolution = 25
    , isCrowdMapOn = False
    , tagsSearchFieldContent = ""
    , tags = []
    }



---- UPDATE ----


type Msg
    = ToggleCrowdMap
    | UpdateCrowdMapResolution Int
    | UpdateTagsSearchFieldContent String
    | GotActivity String
    | RemoveTag String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ToggleCrowdMap ->
            ( { model | isCrowdMapOn = not model.isCrowdMapOn }, Ports.toggleCrowdMap () )

        UpdateCrowdMapResolution resolution ->
            ( { model | crowdMapResolution = resolution }, Ports.updateResolutionPort resolution )

        UpdateTagsSearchFieldContent content ->
            ( { model | tagsSearchFieldContent = content }, Ports.showAutocomplete content )

        GotActivity activityValue ->
            let
                newTags =
                    activityValue :: model.tags
            in
            ( { model | tags = newTags, tagsSearchFieldContent = "" }, Ports.updateTags newTags )

        RemoveTag tagContent ->
            let
                filteredTags =
                    List.filter ((/=) tagContent) model.tags
            in
            ( { model | tags = filteredTags }, Ports.updateTags filteredTags )



---- VIEW ----


view : Model -> Html Msg
view model =
    div []
        [ text "Tags"
        , hr [] []
        , viewTagsArea model.tagsSearchFieldContent model.tags
        , text "Layers"
        , hr [] []
        , viewCrowdMapCheckBox model.isCrowdMapOn
        , viewCrowdMapSlider (String.fromInt model.crowdMapResolution)
        ]


viewTagsArea : String -> List String -> Html Msg
viewTagsArea tagsSearchFieldContent tags =
    div [ Attr.id "tags" ]
        [ input
            [ Attr.id "tags-search"
            , Events.onInput UpdateTagsSearchFieldContent
            , Attr.value tagsSearchFieldContent
            ]
            []
        , div [] (List.map viewTag tags)
        ]


viewTag : String -> Html Msg
viewTag tagContent =
    div []
        [ text tagContent
        , button
            [ Attr.id tagContent
            , Events.onClick (RemoveTag tagContent)
            ]
            []
        ]


viewCrowdMapCheckBox : Bool -> Html Msg
viewCrowdMapCheckBox isCrowdMapOn =
    div [ Attr.class "textfield" ]
        [ p []
            [ input
                [ Attr.id "checkbox-crowd-map"
                , Attr.type_ "checkbox"
                , Attr.checked isCrowdMapOn
                , Events.onClick ToggleCrowdMap
                ]
                []
            , label [ Attr.for "checkbox-crowd-map" ]
                [ text "Crowd Map" ]
            ]
        ]


viewCrowdMapSlider : String -> Html Msg
viewCrowdMapSlider resolution =
    div [ Attr.id "crowd-map-slider" ]
        [ p []
            [ text "Resolution" ]
        , div []
            [ input
                [ Attr.class "crowd-map-slider"
                , onChange (String.toInt >> Maybe.withDefault 25 >> UpdateCrowdMapResolution)
                , Attr.value resolution
                , Attr.max "50"
                , Attr.min "10"
                , Attr.type_ "range"
                ]
                []
            , span []
                [ text resolution ]
            ]
        ]


onChange : (String -> msg) -> Html.Attribute msg
onChange tagger =
    Events.on "change" (Json.Decode.map tagger Events.targetValue)



---- PROGRAM ----


main : Program Flags Model Msg
main =
    Browser.element
        { view = view
        , init = init
        , update = update
        , subscriptions = \_ -> Ports.tagSelected GotActivity
        }

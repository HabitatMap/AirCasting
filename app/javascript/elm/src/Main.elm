port module Main exposing (Msg(..), defaultModel, update, view)

import Browser
import Html exposing (Html, button, div, h4, input, label, p, span, text)
import Html.Attributes as Attr
import Html.Events as Events
import Json.Decode
import Labels exposing (Labels)
import Ports
import Set



---- MODEL ----


type alias Model =
    { crowdMapResolution : Int
    , isCrowdMapOn : Bool
    , tags : Labels
    , profiles : Labels
    }


defaultModel : Model
defaultModel =
    { crowdMapResolution = 25
    , isCrowdMapOn = False
    , tags = Labels.empty
    , profiles = Labels.empty
    }


type alias Flags =
    { crowdMapResolution : Int
    , isCrowdMapOn : Bool
    , tags : List String
    , profiles : List String
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { defaultModel
        | isCrowdMapOn = flags.isCrowdMapOn
        , crowdMapResolution = flags.crowdMapResolution
        , tags = Labels.fromList flags.tags
        , profiles = Labels.fromList flags.profiles
      }
    , Cmd.none
    )



---- UPDATE ----


type Msg
    = ToggleCrowdMap
    | UpdateCrowdMapResolution Int
    | UpdateTagsSearch String
    | AddTag String
    | RemoveTag String
    | UpdateProfileSearch String
    | AddProfile String
    | RemoveProfile String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ToggleCrowdMap ->
            ( { model | isCrowdMapOn = not model.isCrowdMapOn }, Ports.toggleCrowdMap () )

        UpdateCrowdMapResolution resolution ->
            ( { model | crowdMapResolution = resolution }, Ports.updateResolutionPort resolution )

        UpdateTagsSearch content ->
            ( { model | tags = Labels.updateCandidate model.tags content }, Cmd.none )

        UpdateProfileSearch content ->
            ( { model | profiles = Labels.updateCandidate model.profiles content }, Cmd.none )

        AddTag tag_ ->
            addLabel tag_ model.tags (updateTags model) Ports.updateTags

        RemoveTag tag_ ->
            removeLabel tag_ model.tags (updateTags model) Ports.updateTags

        AddProfile profile ->
            addLabel profile model.profiles (updateProfiles model) Ports.updateProfiles

        RemoveProfile profile ->
            removeLabel profile model.profiles (updateProfiles model) Ports.updateProfiles


removeLabel : String -> Labels -> (Labels -> Model) -> (List String -> Cmd a) -> ( Model, Cmd a )
removeLabel labelToRemove labels updateLabels toCmd =
    let
        newLabels =
            Labels.remove labels labelToRemove
    in
    ( updateLabels newLabels, toCmd (Labels.asList newLabels) )


addLabel : String -> Labels -> (Labels -> Model) -> (List String -> Cmd a) -> ( Model, Cmd a )
addLabel newLabel labels updateLabels toCmd =
    let
        newLabels =
            Labels.add labels newLabel
    in
    ( updateLabels newLabels, toCmd (Labels.asList newLabels) )


updateProfiles : { a | profiles : Labels } -> Labels -> { a | profiles : Labels }
updateProfiles labelled labels =
    { labelled | profiles = labels }


updateTags : { a | tags : Labels } -> Labels -> { a | tags : Labels }
updateTags labelled labels =
    { labelled | tags = labels }



---- VIEW ----


view : Model -> Html Msg
view model =
    div []
        [ viewLabels model.profiles "Profile Names" "test-profiles" "profiles-search" UpdateProfileSearch RemoveProfile
        , viewLabels model.tags "Tags" "test-tags" "tags-search" UpdateTagsSearch RemoveTag
        , h4 []
          [ text "Layers"
          ]
        , viewCrowdMapCheckBox model.isCrowdMapOn
        , viewCrowdMapSlider (String.fromInt model.crowdMapResolution)
        ]


viewLabels : Labels -> String -> String -> String -> (String -> Msg) -> (String -> Msg) -> Html Msg
viewLabels labels description testId inputId updateSearchMsg removeLabelMsg =
    div [ Attr.id testId ]
        [ h4 []
          [ text description
          ]
        , input
            [ Attr.id inputId
            , Attr.class "filters-input"
            , Events.onInput updateSearchMsg
            , Attr.value <| Labels.getCandidate labels
            ]
            []
        , div [] (List.map (viewLabel removeLabelMsg) (Labels.asList labels))
        ]


viewLabel : (String -> Msg) -> String -> Html Msg
viewLabel msg profile =
    div [ Attr.class "filters-tag"]
        [ text profile
        , button
            [ Attr.id profile
            , Attr.class "filters-tag-close"
            , Events.onClick (msg profile)
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
        , subscriptions = \_ -> subscriptions
        }


subscriptions =
    Sub.batch [ Ports.tagSelected AddTag, Ports.profileNameSelected AddProfile ]

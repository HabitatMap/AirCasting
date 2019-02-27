port module Main exposing (Msg(..), defaultModel, update, view)

import Browser
import Html exposing (Html, button, div, hr, input, label, p, span, text)
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
            let
                newTags =
                    Labels.addToCollection model.tags tag_
            in
            ( { model | tags = newTags }, Ports.updateTags (Labels.getCollection newTags) )

        RemoveTag tagContent ->
            let
                filteredTags =
                    Labels.removeFromCollection model.tags tagContent
            in
            ( { model | tags = filteredTags }, Ports.updateTags (Labels.getCollection filteredTags) )

        AddProfile profile ->
            let
                newProfiles =
                    Labels.addToCollection model.profiles profile
            in
            ( { model | profiles = newProfiles }, Ports.updateProfiles (Labels.getCollection newProfiles) )

        RemoveProfile profile ->
            let
                filteredProfiles =
                    Labels.removeFromCollection model.profiles profile
            in
            ( { model | profiles = filteredProfiles }, Ports.updateProfiles (Labels.getCollection filteredProfiles) )



---- VIEW ----


view : Model -> Html Msg
view model =
    div []
        [ viewProfiles model.profiles
        , viewTags model.tags
        , text "Layers"
        , hr [] []
        , viewCrowdMapCheckBox model.isCrowdMapOn
        , viewCrowdMapSlider (String.fromInt model.crowdMapResolution)
        ]


viewProfiles : Labels -> Html Msg
viewProfiles profiles =
    div [ Attr.id "test-profile-names" ]
        [ text "Profile Names"
        , hr [] []
        , input
            [ Attr.id "profiles-search"
            , Events.onInput UpdateProfileSearch
            , Attr.value <| Labels.getCandidate profiles
            ]
            []
        , div [] (List.map viewProfileName (Labels.asList profiles))
        ]


viewProfileName : String -> Html Msg
viewProfileName profile =
    div []
        [ text profile
        , button
            [ Attr.id profile
            , Events.onClick (RemoveProfile profile)
            ]
            []
        ]


viewTags : Labels -> Html Msg
viewTags tags =
    div [ Attr.id "tags" ]
        [ text "Tags"
        , hr [] []
        , input
            [ Attr.id "tags-search"
            , Events.onInput UpdateTagsSearch
            , Attr.value <| Labels.getCandidate tags
            ]
            []
        , div [] (List.map viewTag (Labels.asList tags))
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
        , subscriptions = \_ -> subscriptions
        }


subscriptions =
    Sub.batch [ Ports.tagSelected AddTag, Ports.profileNameSelected AddProfile ]

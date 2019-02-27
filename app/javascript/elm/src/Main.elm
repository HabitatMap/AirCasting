port module Main exposing (Msg(..), defaultModel, update, view)

import Browser
import Html exposing (Html, button, div, hr, input, label, p, span, text)
import Html.Attributes as Attr
import Html.Events as Events
import Json.Decode
import Ports
import Set



---- MODEL ----


type alias Model =
    { crowdMapResolution : Int
    , isCrowdMapOn : Bool
    , tagsSearch : String
    , tags : List String
    , profilesSearch : String
    , profiles : Set.Set String
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
        , tags = flags.tags
        , profiles = Set.fromList flags.profiles
      }
    , Cmd.none
    )


defaultModel : Model
defaultModel =
    { crowdMapResolution = 25
    , isCrowdMapOn = False
    , tagsSearch = ""
    , tags = []
    , profilesSearch = ""
    , profiles = Set.empty
    }



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
            ( { model | tagsSearch = content }, Cmd.none )

        AddTag tag_ ->
            let
                newTags =
                    tag_ :: model.tags
            in
            ( { model | tags = newTags, tagsSearch = "" }, Ports.updateTags newTags )

        RemoveTag tagContent ->
            let
                filteredTags =
                    List.filter ((/=) tagContent) model.tags
            in
            ( { model | tags = filteredTags }, Ports.updateTags filteredTags )

        UpdateProfileSearch content ->
            ( { model | profilesSearch = content }, Cmd.none )

        AddProfile profile ->
            let
                newProfiles =
                    Set.insert profile model.profiles
            in
            ( { model | profiles = newProfiles, profilesSearch = "" }, Ports.updateProfiles (Set.toList newProfiles) )

        RemoveProfile profile ->
            let
                filteredProfiles =
                    Set.remove profile model.profiles
            in
            ( { model | profiles = filteredProfiles }, Ports.updateProfiles (Set.toList filteredProfiles) )



---- VIEW ----


view : Model -> Html Msg
view model =
    div []
        [ viewProfiles model.profilesSearch model.profiles
        , viewTags model.tagsSearch model.tags
        , text "Layers"
        , hr [] []
        , viewCrowdMapCheckBox model.isCrowdMapOn
        , viewCrowdMapSlider (String.fromInt model.crowdMapResolution)
        ]


viewProfiles : String -> Set.Set String -> Html Msg
viewProfiles profilesSearch profile =
    div [ Attr.id "test-profile-names" ]
        [ text "Profile Names"
        , hr [] []
        , input
            [ Attr.id "profiles-search"
            , Events.onInput UpdateProfileSearch
            , Attr.value profilesSearch
            ]
            []
        , div [] (List.map viewProfileName (Set.toList profile))
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


viewTags : String -> List String -> Html Msg
viewTags tagsSearch tags =
    div [ Attr.id "tags" ]
        [ text "Tags"
        , hr [] []
        , input
            [ Attr.id "tags-search"
            , Events.onInput UpdateTagsSearch
            , Attr.value tagsSearch
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
        , subscriptions = \_ -> subscriptions
        }


subscriptions =
    Sub.batch [ Ports.tagSelected AddTag, Ports.profileNameSelected AddProfile ]

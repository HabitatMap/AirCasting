module MobileSessionsFilters exposing (Msg(..), defaultModel, update, view)

import Browser
import Html exposing (Html, div, h4, input, label, p, span, text)
import Html.Attributes as Attr
import Html.Events as Events
import Json.Decode as Decode
import Json.Encode as Encode
import Labels exposing (Labels)
import Ports
import TimeRange exposing (TimeRange)



---- MODEL ----


type alias Model =
    { crowdMapResolution : Int
    , isCrowdMapOn : Bool
    , tags : Labels
    , profiles : Labels
    , timeRange : TimeRange
    }


defaultModel : Model
defaultModel =
    { crowdMapResolution = 25
    , isCrowdMapOn = False
    , tags = Labels.empty
    , profiles = Labels.empty
    , timeRange = TimeRange.defaultTimeRange
    }


type alias Flags =
    { crowdMapResolution : Int
    , isCrowdMapOn : Bool
    , tags : List String
    , profiles : List String
    , timeRange : Encode.Value
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { defaultModel
        | isCrowdMapOn = flags.isCrowdMapOn
        , crowdMapResolution = flags.crowdMapResolution
        , tags = Labels.fromList flags.tags
        , profiles = Labels.fromList flags.profiles
        , timeRange = TimeRange.update defaultModel.timeRange flags.timeRange
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
    | UpdateTimeRange Encode.Value


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ToggleCrowdMap ->
            ( { model | isCrowdMapOn = not model.isCrowdMapOn }, Ports.toggleCrowdMap () )

        UpdateCrowdMapResolution resolution ->
            ( { model | crowdMapResolution = resolution }, Ports.updateResolution resolution )

        UpdateTagsSearch content ->
            ( { model | tags = Labels.updateCandidate model.tags content }, Cmd.none )

        UpdateProfileSearch content ->
            ( { model | profiles = Labels.updateCandidate model.profiles content }, Cmd.none )

        AddTag tag_ ->
            Labels.addLabel tag_ model.tags (updateTags model) Ports.updateTags

        RemoveTag tag_ ->
            Labels.removeLabel tag_ model.tags (updateTags model) Ports.updateTags

        AddProfile profile ->
            Labels.addLabel profile model.profiles (updateProfiles model) Ports.updateProfiles

        RemoveProfile profile ->
            Labels.removeLabel profile model.profiles (updateProfiles model) Ports.updateProfiles

        UpdateTimeRange value ->
            let
                newTimeRange =
                    TimeRange.update model.timeRange value
            in
            ( { model | timeRange = newTimeRange }, Cmd.none )


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
        [ Labels.viewLabels model.profiles "Profile Names" "profiles-search" UpdateProfileSearch RemoveProfile AddProfile
        , Labels.viewLabels model.tags "Tags" "tags-search" UpdateTagsSearch RemoveTag AddTag
        , h4 []
            [ text "Layers"
            ]
        , viewCrowdMapCheckBox model.isCrowdMapOn
        , viewCrowdMapSlider (String.fromInt model.crowdMapResolution)
        , TimeRange.viewTimeFilter
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
    Events.on "change" (Decode.map tagger Events.targetValue)



---- PROGRAM ----


main : Program Flags Model Msg
main =
    Browser.element
        { view = view
        , init = init
        , update = update
        , subscriptions = \_ -> subscriptions
        }


subscriptions : Sub Msg
subscriptions =
    Sub.batch
        [ Ports.tagSelected AddTag
        , Ports.profileNameSelected AddProfile
        , Ports.timeRangeSelected UpdateTimeRange
        ]

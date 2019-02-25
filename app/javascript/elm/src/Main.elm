port module Main exposing (Msg(..), defaultModel, update, view)

import Browser
import Debug
import Html exposing (Html, div, hr, input, label, p, span, text)
import Html.Attributes exposing (checked, class, for, id, max, min, type_, value)
import Html.Events as Events exposing (on, onClick, onInput)
import Json.Decode as Decode
import Ports exposing (tagSelected, updateTagsSearchField)
import SearchFieldWithTags



---- MODEL ----


type alias Model =
    { crowdMapResolution : Int
    , isCrowdMapOn : Bool
    , tagsSearchField : SearchFieldWithTags.Model
    }


type alias Flags =
    { crowdMapResolution : Int
    , isCrowdMapOn : Bool
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { defaultModel
        | isCrowdMapOn = flags.isCrowdMapOn
        , crowdMapResolution = flags.crowdMapResolution
      }
    , Cmd.none
    )


defaultModel : Model
defaultModel =
    { crowdMapResolution = 25
    , isCrowdMapOn = False
    , tagsSearchField = SearchFieldWithTags.initialModel
    }



---- UPDATE ----


port toggleCrowdMap : () -> Cmd a


port updateResolutionPort : Int -> Cmd a


type Msg
    = ToggleCrowdMap
    | UpdateCrowdMapResolution Int
    | TagsSearchFieldMsg SearchFieldWithTags.Msg
    | GotActivity String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ToggleCrowdMap ->
            ( { model | isCrowdMapOn = not model.isCrowdMapOn }, toggleCrowdMap () )

        UpdateCrowdMapResolution resolution ->
            ( { model | crowdMapResolution = resolution }, updateResolutionPort resolution )

        TagsSearchFieldMsg subMsg ->
            let
                ( subModel, subCmd ) =
                    SearchFieldWithTags.update subMsg model.tagsSearchField
            in
            ( { model | tagsSearchField = subModel }, Cmd.map TagsSearchFieldMsg subCmd )

        GotActivity activity ->
            let
                ( subModel, subCmd ) =
                    SearchFieldWithTags.update (SearchFieldWithTags.GotActivity activity) model.tagsSearchField
            in
            ( { model | tagsSearchField = subModel }, subCmd )



---- VIEW ----


view : Model -> Html Msg
view model =
    div []
        [ text "Tags"
        , hr [] []
        , Html.map TagsSearchFieldMsg (SearchFieldWithTags.view model.tagsSearchField)
        , text "Layers"
        , hr [] []
        , viewCrowdMapCheckBox model.isCrowdMapOn
        , viewCrowdMapSlider (String.fromInt model.crowdMapResolution)
        ]


viewCrowdMapCheckBox : Bool -> Html Msg
viewCrowdMapCheckBox isCrowdMapOn =
    div [ class "textfield" ]
        [ p []
            [ input
                [ id "checkbox-crowd-map"
                , type_ "checkbox"
                , checked isCrowdMapOn
                , onClick ToggleCrowdMap
                ]
                []
            , label [ for "checkbox-crowd-map" ]
                [ text "Crowd Map" ]
            ]
        ]


viewCrowdMapSlider : String -> Html Msg
viewCrowdMapSlider resolution =
    div [ id "crowd-map-slider" ]
        [ p []
            [ text "Resolution" ]
        , div []
            [ input
                [ class "crowd-map-slider"
                , onChange (String.toInt >> Maybe.withDefault 25 >> UpdateCrowdMapResolution)
                , value resolution
                , max "50"
                , min "10"
                , type_ "range"
                ]
                []
            , span []
                [ text resolution ]
            ]
        ]


onChange : (String -> msg) -> Html.Attribute msg
onChange tagger =
    on "change" (Decode.map tagger Events.targetValue)



---- PROGRAM ----


main : Program Flags Model Msg
main =
    Browser.element
        { view = view
        , init = init
        , update = update
        , subscriptions = \_ -> tagSelected GotActivity
        }

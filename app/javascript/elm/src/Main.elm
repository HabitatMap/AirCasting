port module Main exposing (Msg(..), defaultModel, update, view)

import Browser
import Html exposing (Html, div, input, label, p, span, text)
import Html.Attributes exposing (checked, class, for, id, max, min, type_, value)
import Html.Events exposing (on, onClick, targetValue)
import Json.Decode



---- MODEL ----


type alias Model =
    { crowdMapResolution : Int
    , isCrowdMapOn : Bool
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
    }



---- UPDATE ----


port toggleCrowdMap : () -> Cmd a


port updateResolutionPort : Int -> Cmd a


type Msg
    = ToggleCrowdMap
    | UpdateCrowdMapResolution Int


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ToggleCrowdMap ->
            ( { model | isCrowdMapOn = not model.isCrowdMapOn }, toggleCrowdMap () )

        UpdateCrowdMapResolution resolution ->
            ( { model | crowdMapResolution = resolution }, updateResolutionPort resolution )



---- VIEW ----


view : Model -> Html Msg
view model =
    div []
        [ viewCrowdMapCheckBox model.isCrowdMapOn
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
    on "change" (Json.Decode.map tagger Html.Events.targetValue)



---- PROGRAM ----


main : Program Flags Model Msg
main =
    Browser.element
        { view = view
        , init = init
        , update = update
        , subscriptions = \_ -> Sub.none
        }

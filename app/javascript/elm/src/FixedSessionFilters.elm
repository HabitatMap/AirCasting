module FixedSessionFilters exposing (Msg(..), defaultModel, update, view)

import Browser
import Html exposing (Html, div)
import Json.Encode as Encode
import Labels exposing (Labels)
import Ports
import TimeRange exposing (TimeRange)



---- MODEL ----


type alias Model =
    { tags : Labels
    , profiles : Labels
    , timeRange : TimeRange
    }


defaultModel : Model
defaultModel =
    { tags = Labels.empty
    , profiles = Labels.empty
    , timeRange = TimeRange.defaultTimeRange
    }


type alias Flags =
    { tags : List String
    , profiles : List String
    , timeRange : Encode.Value
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { defaultModel
        | tags = Labels.fromList flags.tags
        , profiles = Labels.fromList flags.profiles
        , timeRange = TimeRange.update defaultModel.timeRange flags.timeRange
      }
    , Cmd.none
    )



---- UPDATE ----


type Msg
    = UpdateTagsSearch String
    | AddTag String
    | RemoveTag String
    | UpdateProfileSearch String
    | AddProfile String
    | RemoveProfile String
    | UpdateTimeRange Encode.Value


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
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
            ( { model | timeRange = newTimeRange }, Ports.updateTimeRange value )


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
        , TimeRange.viewTimeFilter
        ]



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

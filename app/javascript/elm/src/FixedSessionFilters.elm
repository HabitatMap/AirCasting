module FixedSessionFilters exposing (init)

import Browser
import Html exposing (Html, div)
import Html.Attributes as Attr
import Html.Events as Events
import Labels exposing (Labels)
import Ports



---- MODEL ----


type alias Model =
    { tags : Labels
    , profiles : Labels
    }


defaultModel : Model
defaultModel =
    { tags = Labels.empty
    , profiles = Labels.empty
    }


type alias Flags =
    { tags : List String
    , profiles : List String
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { defaultModel
        | tags = Labels.fromList flags.tags
        , profiles = Labels.fromList flags.profiles
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


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
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
        [ Labels.viewLabels model.profiles "Profile Names" "test-profiles" "profiles-search" UpdateProfileSearch RemoveProfile AddProfile
        , Labels.viewLabels model.tags "Tags" "test-tags" "tags-search" UpdateTagsSearch RemoveTag AddTag
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


subscriptions =
    Sub.batch [ Ports.tagSelected AddTag, Ports.profileNameSelected AddProfile ]

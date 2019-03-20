module FixedSessionFilters exposing (Msg(..), defaultModel, update, view)

import Browser
import Html exposing (Html, button, div, input, text)
import Html.Attributes as Attr
import Html.Events as Events
import Http
import Json.Encode as Encode
import LabelsInput
import Ports
import TimeRange exposing (TimeRange)



---- MODEL ----


type alias Model =
    { tags : LabelsInput.Model
    , profiles : LabelsInput.Model
    , timeRange : TimeRange
    , copyLinkState : CopyLinkState
    }


defaultModel : Model
defaultModel =
    { tags = LabelsInput.empty
    , profiles = LabelsInput.empty
    , timeRange = TimeRange.defaultTimeRange
    , copyLinkState = NotAsked
    }


type CopyLinkState
    = NotAsked
    | Fetching
    | Fetched String


type alias Flags =
    { tags : List String
    , profiles : List String
    , timeRange : Encode.Value
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { defaultModel
        | tags = LabelsInput.init flags.tags
        , profiles = LabelsInput.init flags.profiles
        , timeRange = TimeRange.update defaultModel.timeRange flags.timeRange
      }
    , Cmd.none
    )



---- UPDATE ----


type Msg
    = TagsLabels LabelsInput.Msg
    | ProfileLabels LabelsInput.Msg
    | UpdateTimeRange Encode.Value
    | ShowCopyLinkTooltip


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        TagsLabels subMsg ->
            updateLabels subMsg model.tags Ports.updateTags TagsLabels (\tags -> { model | tags = tags })

        ProfileLabels subMsg ->
            updateLabels subMsg model.profiles Ports.updateProfiles ProfileLabels (\profiles -> { model | profiles = profiles })

        UpdateTimeRange value ->
            let
                newTimeRange =
                    TimeRange.update model.timeRange value
            in
            ( { model | timeRange = newTimeRange }, Cmd.none )

        ShowCopyLinkTooltip ->
            ( model, Ports.showCopyLinkTooltip () )


updateLabels :
    LabelsInput.Msg
    -> LabelsInput.Model
    -> (List String -> Cmd LabelsInput.Msg)
    -> (LabelsInput.Msg -> Msg)
    -> (LabelsInput.Model -> Model)
    -> ( Model, Cmd Msg )
updateLabels msg model toSubCmd mapper updateModel =
    let
        ( subModel, subCmd ) =
            LabelsInput.update msg model toSubCmd
    in
    ( updateModel subModel, Cmd.map mapper subCmd )



---- VIEW ----


view : Model -> Html Msg
view model =
    div []
        [ Html.map ProfileLabels <| LabelsInput.view model.profiles "Profile Names" "profiles-search"
        , Html.map TagsLabels <| LabelsInput.view model.tags "Tags" "tags-search"
        , TimeRange.viewTimeFilter
        , button [ Events.onClick ShowCopyLinkTooltip, Attr.id "copy-link-tooltip" ] [ text "oo" ]
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
    Sub.batch <|
        [ Sub.map ProfileLabels <| LabelsInput.subscriptions Ports.profileSelected
        , Sub.map TagsLabels <| LabelsInput.subscriptions Ports.tagSelected
        , Ports.timeRangeSelected UpdateTimeRange
        ]

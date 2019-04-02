module FixedSessionFilters exposing (Msg(..), defaultModel, update, view)

import Browser
import Browser.Events
import Html exposing (Html, button, div, h4, input, text)
import Html.Attributes as Attr
import Html.Events as Events
import Http
import Json.Decode as Decode
import Json.Encode as Encode
import LabelsInput
import Popup
import Ports
import TimeRange exposing (TimeRange)



---- MODEL ----


type alias Model =
    { popup : Popup.Popup
    , isPopupExtended : Bool
    , parameters : Popup.Items
    , selectedParameter : String
    , location : String
    , tags : LabelsInput.Model
    , profiles : LabelsInput.Model
    , timeRange : TimeRange
    }


defaultModel : Model
defaultModel =
    { popup = Popup.None
    , isPopupExtended = False
    , parameters =
        { main = [ "Particulate Matter", "Humidity", "Temperature", "Sound Levels" ]
        , other = Nothing
        }
    , selectedParameter = "Particulate Matter"
    , location = ""
    , tags = LabelsInput.empty
    , profiles = LabelsInput.empty
    , timeRange = TimeRange.defaultTimeRange
    }


type alias Flags =
    { location : String
    , tags : List String
    , profiles : List String
    , timeRange : Encode.Value
    , selectedParameter : String
    , parametersList : Encode.Value
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    let
        result =
            Decode.decodeValue (Decode.list (Decode.field "id" Decode.string)) flags.parametersList

        fetchedParameters =
            case result of
                Ok values ->
                    values
                        |> List.filter (\value -> not (List.member value defaultModel.parameters.main))
                        |> List.sort
                        |> Just

                Err _ ->
                    Nothing
    in
    ( { defaultModel
        | location = flags.location
        , tags = LabelsInput.init flags.tags
        , profiles = LabelsInput.init flags.profiles
        , timeRange = TimeRange.update defaultModel.timeRange flags.timeRange
        , selectedParameter = flags.selectedParameter
        , parameters = { main = defaultModel.parameters.main, other = fetchedParameters }
      }
    , Ports.selectParameter flags.selectedParameter
    )



---- UPDATE ----


type Msg
    = UpdateLocationInput String
    | SubmitLocation
    | TagsLabels LabelsInput.Msg
    | ProfileLabels LabelsInput.Msg
    | UpdateTimeRange Encode.Value
    | ShowCopyLinkTooltip
    | ShowSelectFormItemsPopup
    | SelectParameter String
    | ClosePopup
    | TogglePopupState


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UpdateLocationInput newLocation ->
            ( { model | location = newLocation }, Cmd.none )

        SubmitLocation ->
            ( model, Ports.findLocation model.location )

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

        ShowSelectFormItemsPopup ->
            ( { model | popup = Popup.SelectFromItems model.parameters }, Cmd.none )

        ClosePopup ->
            ( { model | popup = Popup.None, isPopupExtended = False }, Cmd.none )

        TogglePopupState ->
            ( { model | isPopupExtended = not model.isPopupExtended }, Cmd.none )

        SelectParameter parameter ->
            ( { model | selectedParameter = parameter }, Ports.selectParameter parameter )


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
        [ viewParameterFilter model.selectedParameter
        , Popup.viewPopup TogglePopupState SelectParameter model.isPopupExtended model.popup
        , viewLocation model.location
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "Profile Names" "profiles-search"
        , Html.map TagsLabels <| LabelsInput.view model.tags "Tags" "tags-search"
        , TimeRange.viewTimeFilter
        , button [ Events.onClick ShowCopyLinkTooltip, Attr.id "copy-link-tooltip" ] [ text "oo" ]
        ]


viewParameterFilter : String -> Html Msg
viewParameterFilter selectedParameter =
    div []
        [ h4 [] [ text "parameter" ]
        , input
            [ Attr.id "parameter-filter"
            , Popup.clickWithoutDefault ShowSelectFormItemsPopup
            , Attr.value selectedParameter
            ]
            []
        ]


viewLocation : String -> Html Msg
viewLocation location =
    div []
        [ h4 [] [ text "Location" ]
        , input
            [ Attr.id "location-filter"
            , Attr.value location
            , Events.onInput UpdateLocationInput
            , onEnter SubmitLocation
            ]
            []
        ]


onEnter : msg -> Html.Attribute msg
onEnter msg =
    let
        isEnter code =
            if code == 13 then
                Decode.succeed msg

            else
                Decode.fail "not ENTER"
    in
    Events.on "keydown" (Decode.andThen isEnter Events.keyCode)



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
        , Ports.locationCleared (always (UpdateLocationInput ""))
        , Browser.Events.onClick (Decode.succeed ClosePopup)
        ]

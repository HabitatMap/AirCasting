module MobileSessionsFilters exposing (Msg(..), Popups(..), defaultModel, update, view, viewPopup)

import Browser
import Browser.Events
import Html exposing (Html, button, div, h4, input, label, li, option, p, select, span, text, ul)
import Html.Attributes as Attr
import Html.Events as Events
import Json.Decode as Decode
import Json.Encode as Encode
import LabelsInput
import Ports
import TimeRange exposing (TimeRange)



---- MODEL ----


type alias Model =
    { popup : Popups
    , isPopupExtended : Bool
    , parameters : Items
    , selectedParameter : String
    , location : String
    , tags : LabelsInput.Model
    , profiles : LabelsInput.Model
    , isCrowdMapOn : Bool
    , crowdMapResolution : Int
    , timeRange : TimeRange
    }


type Popups
    = SelectFromItems Items
    | None


type alias Items =
    { main : List String, other : Maybe (List String) }


defaultModel : Model
defaultModel =
    { popup = None
    , isPopupExtended = False
    , parameters =
        { main = [ "Particulate Matter", "Humidity", "Temperature", "Sound Levels" ]
        , other = Nothing
        }
    , selectedParameter = "Particulate Matter"
    , location = ""
    , tags = LabelsInput.empty
    , profiles = LabelsInput.empty
    , isCrowdMapOn = False
    , crowdMapResolution = 25
    , timeRange = TimeRange.defaultTimeRange
    }


type alias Flags =
    { location : String
    , tags : List String
    , profiles : List String
    , isCrowdMapOn : Bool
    , crowdMapResolution : Int
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

                Err _ ->
                    []
    in
    ( { defaultModel
        | location = flags.location
        , tags = LabelsInput.init flags.tags
        , profiles = LabelsInput.init flags.profiles
        , isCrowdMapOn = flags.isCrowdMapOn
        , crowdMapResolution = flags.crowdMapResolution
        , timeRange = TimeRange.update defaultModel.timeRange flags.timeRange
        , selectedParameter = flags.selectedParameter
        , parameters = { main = defaultModel.parameters.main, other = Just fetchedParameters }
      }
    , Ports.selectParameter flags.selectedParameter
    )



---- UPDATE ----


type Msg
    = UpdateLocationInput String
    | SubmitLocation
    | TagsLabels LabelsInput.Msg
    | ProfileLabels LabelsInput.Msg
    | ToggleCrowdMap
    | UpdateCrowdMapResolution Int
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

        ToggleCrowdMap ->
            ( { model | isCrowdMapOn = not model.isCrowdMapOn }, Ports.toggleCrowdMap (not model.isCrowdMapOn) )

        UpdateCrowdMapResolution resolution ->
            ( { model | crowdMapResolution = resolution }, Ports.updateResolution resolution )

        UpdateTimeRange value ->
            let
                newTimeRange =
                    TimeRange.update model.timeRange value
            in
            ( { model | timeRange = newTimeRange }, Cmd.none )

        ShowCopyLinkTooltip ->
            ( model, Ports.showCopyLinkTooltip () )

        ShowSelectFormItemsPopup ->
            ( { model | popup = SelectFromItems model.parameters }, Cmd.none )

        ClosePopup ->
            ( { model | popup = None, isPopupExtended = False }, Cmd.none )

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
        , case model.popup of
            SelectFromItems items ->
                viewPopup SelectParameter model.isPopupExtended items

            None ->
                text ""
        , viewLocation model.location
        , Html.map ProfileLabels <| LabelsInput.view model.profiles "Profile Names" "profiles-search"
        , Html.map TagsLabels <| LabelsInput.view model.tags "Tags" "tags-search"
        , h4 []
            [ text "Layers"
            ]
        , viewCrowdMapCheckBox model.isCrowdMapOn
        , viewCrowdMapSlider (String.fromInt model.crowdMapResolution)
        , TimeRange.viewTimeFilter
        , button [ Events.onClick ShowCopyLinkTooltip, Attr.id "copy-link-tooltip" ] [ text "oo" ]
        ]


viewParameterFilter : String -> Html Msg
viewParameterFilter selectedParameter =
    div []
        [ h4 [] [ text "parameter" ]
        , input
            [ Attr.id "parameter-filter"
            , clickWithoutDefault ShowSelectFormItemsPopup
            , Attr.value selectedParameter
            ]
            []
        ]


viewPopup : (String -> Msg) -> Bool -> Items -> Html Msg
viewPopup onSelect isPopupExtended items =
    div [ Attr.id "popup" ]
        [ selectableItems items.main onSelect
        , case items.other of
            Just moreItems ->
                if isPopupExtended then
                    div []
                        [ selectableItems moreItems onSelect
                        , togglePopupStateButton "less parameters"
                        ]

                else
                    togglePopupStateButton "more parameters"

            Nothing ->
                text ""
        ]


togglePopupStateButton name =
    button
        [ Attr.id "toggle-popup-button"
        , clickWithoutDefault TogglePopupState
        ]
        [ text name ]


selectableItems : List String -> (String -> Msg) -> Html Msg
selectableItems items onSelect =
    items
        |> List.map (\item -> li [] [ button [ Events.onClick (onSelect item) ] [ text item ] ])
        |> ul []


clickWithoutDefault : Msg -> Html.Attribute Msg
clickWithoutDefault msg =
    Events.custom "click" (Decode.map preventDefault (Decode.succeed msg))


preventDefault : Msg -> { message : Msg, stopPropagation : Bool, preventDefault : Bool }
preventDefault msg =
    { message = msg
    , stopPropagation = True
    , preventDefault = True
    }


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
    Sub.batch <|
        [ Sub.map ProfileLabels <| LabelsInput.subscriptions Ports.profileSelected
        , Sub.map TagsLabels <| LabelsInput.subscriptions Ports.tagSelected
        , Ports.timeRangeSelected UpdateTimeRange
        , Ports.locationCleared (always (UpdateLocationInput ""))
        , Browser.Events.onClick (Decode.succeed ClosePopup)
        ]

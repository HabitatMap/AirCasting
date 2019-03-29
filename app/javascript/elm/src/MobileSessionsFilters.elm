module MobileSessionsFilters exposing (Msg(..), Popups(..), defaultModel, update, view, viewPopup)

import Browser
import Browser.Events
import Debug
import Html exposing (Html, button, div, h4, input, label, li, option, p, select, span, text, ul)
import Html.Attributes as Attr
import Html.Events as Events
import Http
import Json.Decode as Decode
import Json.Encode as Encode
import LabelsInput
import Ports
import Set
import TimeRange exposing (TimeRange)



---- MODEL ----


type alias Model =
    { popup : Popups
    , isPopupExtended : Bool
    , parameters : List String
    , selectedParameter : String
    , location : String
    , tags : LabelsInput.Model
    , profiles : LabelsInput.Model
    , isCrowdMapOn : Bool
    , crowdMapResolution : Int
    , timeRange : TimeRange
    }


type Popups
    = SelectFromItems (List String)
    | None


defaultModel : Model
defaultModel =
    { popup = None
    , isPopupExtended = False
    , parameters = []
    , selectedParameter = "particulate matter"
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
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { defaultModel
        | location = flags.location
        , tags = LabelsInput.init flags.tags
        , profiles = LabelsInput.init flags.profiles
        , isCrowdMapOn = flags.isCrowdMapOn
        , crowdMapResolution = flags.crowdMapResolution
        , timeRange = TimeRange.update defaultModel.timeRange flags.timeRange
      }
    , fetchSensors
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
    | GotSensors (Result Http.Error (List String))
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
            ( { model | popup = None }, Cmd.none )

        TogglePopupState ->
            ( { model | isPopupExtended = not model.isPopupExtended }, Cmd.none )

        GotSensors result ->
            case result of
                Ok parameters ->
                    let
                        distinctParameter =
                            parameters |> Set.fromList |> Set.toList
                    in
                    ( { model | parameters = distinctParameter }, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )

        SelectParameter parameter ->
            ( { model | selectedParameter = parameter }, Cmd.none )


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
        [ viewParameter model.selectedParameter
        , case model.popup of
            SelectFromItems items ->
                case model.isPopupExtended of
                    True ->
                        viewPopup SelectParameter model.isPopupExtended items

                    False ->
                        viewPopup SelectParameter model.isPopupExtended items

            None ->
                div [] []
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


viewParameter : String -> Html Msg
viewParameter selectedParameter =
    div []
        [ h4 [] [ text "parameter" ]
        , input
            [ Attr.id "parameter-filter"
            , Events.custom "click" (Decode.map preventDefault (Decode.succeed ShowSelectFormItemsPopup))
            , Attr.value selectedParameter
            ]
            []
        ]


viewPopup : (String -> Msg) -> Bool -> List String -> Html Msg
viewPopup select isPopupExtended items =
    let
        numberOfMainItems =
            4

        mainItems =
            List.take numberOfMainItems items

        moreItems =
            List.drop numberOfMainItems items
    in
    div [ Attr.id "popup" ]
        [ mainItems
            |> List.map (\item -> li [] [ button [ Events.onClick (select item) ] [ text item ] ])
            |> ul []
        , case isPopupExtended of
            False ->
                button
                    [ Events.custom "click" (Decode.map preventDefault (Decode.succeed TogglePopupState))
                    ]
                    [ text "more parameters" ]

            True ->
                div []
                    [ moreItems
                        |> List.map (\item -> li [] [ button [ Events.onClick (select item) ] [ text item ] ])
                        |> ul []
                    , button
                        [ Events.custom "click" (Decode.map preventDefault (Decode.succeed TogglePopupState))
                        ]
                        [ text "less parameters" ]
                    ]
        ]


preventDefault : Msg -> { message : Msg, stopPropagation : Bool, preventDefault : Bool }
preventDefault msg =
    { message = msg
    , stopPropagation = True
    , preventDefault = True
    }


fetchSensors : Cmd Msg
fetchSensors =
    Http.request
        { method = "GET"
        , headers =
            [ Http.header "Accept" "application/json, text/plain, */*"
            , Http.header "X-Requested-With" "XMLHttpRequest"
            ]
        , url = "/api/sensors"
        , body = Http.emptyBody
        , expect = Http.expectJson GotSensors (Decode.list parameterDecoder)
        , timeout = Nothing
        , tracker = Nothing
        }


parameterDecoder : Decode.Decoder String
parameterDecoder =
    Decode.field "measurement_type" Decode.string


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
        , subscriptions = subscriptions
        }


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch <|
        [ Sub.map ProfileLabels <| LabelsInput.subscriptions Ports.profileSelected
        , Sub.map TagsLabels <| LabelsInput.subscriptions Ports.tagSelected
        , Ports.timeRangeSelected UpdateTimeRange
        , Ports.locationCleared (always (UpdateLocationInput ""))
        , Browser.Events.onClick (Decode.succeed ClosePopup)
        ]

module SearchFieldWithTags exposing (Model, Msg(..), initialModel, update, view)

import Html exposing (Html, button, div, input, text)
import Html.Attributes as Attr
import Html.Events as Events
import Ports exposing (updateTagsSearchField)


view : Model -> Html Msg
view model =
    div [ Attr.id "tags" ]
        [ input
            [ Attr.id "tags-search"
            , Events.onInput UpdateFieldContent
            , Attr.value model.searchFieldContent
            ]
            []
        , viewTags model.tags
        ]


viewTags : List String -> Html Msg
viewTags tags =
    div [] (List.map (\tag -> viewTag tag) tags)


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


type Msg
    = UpdateFieldContent String
    | GotActivity String
    | RemoveTag String


update : Msg -> Model -> ( Model, Cmd msg )
update msg model =
    case msg of
        UpdateFieldContent newContent ->
            ( { model | searchFieldContent = newContent }, updateTagsSearchField newContent )

        GotActivity activityValue ->
            ( { model | tags = activityValue :: model.tags }, Cmd.none )

        RemoveTag tagContent ->
            ( { model | tags = List.filter (\tag -> tag /= tagContent) model.tags }, Cmd.none )


type alias Model =
    { searchFieldContent : String
    , tags : List String
    }


initialModel : Model
initialModel =
    { searchFieldContent = ""
    , tags = []
    }

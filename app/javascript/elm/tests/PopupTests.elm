module PopupTests exposing (popups)

import Expect
import Fuzz exposing (list, string)
import Popup exposing (..)
import Test exposing (..)
import Test.Html.Event as Event
import Test.Html.Query as Query
import Test.Html.Selector as Slc


type Msg
    = Toggle
    | Select String


popups : Test
popups =
    describe "Popup tests: "
        [ fuzz (list string) "popup shows main items" <|
            \items ->
                let
                    itemsHtml =
                        List.map (\item -> Slc.containing [ Slc.text item ]) items
                in
                viewListPopup Toggle Select False ( items, [] ) "" ""
                    |> Query.fromHtml
                    |> Query.has [ Slc.all itemsHtml ]
        , fuzz3 string (list string) (list string) "popup shows only main items when not extended" <|
            \mainItem mainItems otherItems ->
                viewListPopup Toggle Select False ( mainItem :: mainItems, otherItems ) "" ""
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.class "test-filter-popup-button" ]
                    |> Query.count (Expect.equal (List.length mainItems + 1))
        , test "if there are no others items popup doesn't have a toggle popup button" <|
            \_ ->
                viewListPopup Toggle Select False ( [], [] ) "" ""
                    |> Query.fromHtml
                    |> Query.hasNot [ Slc.id "toggle-popup-button" ]
        , test "if there are others items popup has a button that triggers TogglePopupState" <|
            \_ ->
                viewListPopup Toggle Select False ( [ "" ], [ "item" ] ) "" ""
                    |> Query.fromHtml
                    |> Query.find [ Slc.id "toggle-popup-button" ]
                    |> Event.simulate Event.click
                    |> Event.expect Toggle
        , fuzz2 (list string) (list string) "popup shows all items when extended" <|
            \mainItems otherItems ->
                let
                    numberOfItems =
                        List.length mainItems + List.length otherItems
                in
                viewListPopup Toggle Select True ( mainItems, otherItems ) "" ""
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.class "test-filter-popup-button" ]
                    |> Query.count (Expect.equal numberOfItems)
        , test "clicking on an item executes select function" <|
            \_ ->
                viewListPopup Toggle Select False ( [ "item" ], [] ) "" ""
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "button", Slc.containing [ Slc.text "item" ] ]
                    |> Event.simulate Event.click
                    |> Event.expect (Select "item")
        , fuzz string "when item is selected it is marked as active" <|
            \mainItem ->
                viewListPopup Toggle Select False ( [ mainItem ], [] ) "" mainItem
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.class "active" ]
                    |> Query.count (Expect.equal 1)
        ]

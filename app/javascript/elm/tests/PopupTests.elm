module PopupTests exposing (popups)

import Expect
import Fuzz exposing (list, string)
import Html exposing (text)
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
                Popup.ExpandableSelectFrom { main = items, others = Nothing }
                    |> view Toggle Select False
                    |> Query.fromHtml
                    |> Query.has [ Slc.all itemsHtml ]
        , fuzz2 (list string) (list string) "popup shows only main items when not extended" <|
            \mainItems otherItems ->
                Popup.ExpandableSelectFrom { main = mainItems, others = Just otherItems }
                    |> view Toggle Select False
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.tag "li" ]
                    |> Query.count (Expect.equal (List.length mainItems))
        , test "if there are no others items popup doesn't have a toggle popup button" <|
            \_ ->
                Popup.ExpandableSelectFrom { main = [], others = Nothing }
                    |> view Toggle Select False
                    |> Query.fromHtml
                    |> Query.hasNot [ Slc.id "toggle-popup-button" ]
        , test "if there are others items popup has a button that triggers TogglePopupState" <|
            \_ ->
                Popup.ExpandableSelectFrom { main = [], others = Just [ "item" ] }
                    |> view Toggle Select False
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
                Popup.ExpandableSelectFrom { main = mainItems, others = Just otherItems }
                    |> view Toggle Select True
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.tag "li" ]
                    |> Query.count (Expect.equal numberOfItems)
        , test "clicking on an item executes select function" <|
            \_ ->
                Popup.ExpandableSelectFrom { main = [ "item" ], others = Nothing }
                    |> view Toggle Select False
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "button", Slc.containing [ Slc.text "item" ] ]
                    |> Event.simulate Event.click
                    |> Event.expect (Select "item")
        ]

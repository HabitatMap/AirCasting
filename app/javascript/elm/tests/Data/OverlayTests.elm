module Data.OverlayTests exposing (suite)

import Data.Overlay as Overlay exposing (Operation(..), Overlay(..))
import Expect
import Test exposing (..)
import Test.Html.Query as Query
import Test.Html.Selector as Slc


suite : Test
suite =
    describe "Data.Overlay"
        [ test "with NoOverlay it displays no overlays" <|
            \_ ->
                let
                    model =
                        Overlay.none
                in
                model
                    |> Overlay.view
                    |> Query.fromHtml
                    |> Query.findAll [ Slc.class "overlay" ]
                    |> Query.count (Expect.equal 0)
        , test "with AddOverlay on top of NoOverlay it displays the added overlay" <|
            \_ ->
                let
                    operation =
                        AddOverlay HttpingOverlay

                    model =
                        Overlay.none
                in
                Overlay.update operation model
                    |> Overlay.view
                    |> Query.fromHtml
                    |> Query.has [ Slc.class "overlay", Slc.id "overlay--httping" ]
        , test "when overlay is removed it is not displayed" <|
            \_ ->
                let
                    operation1 =
                        AddOverlay HttpingOverlay

                    operation2 =
                        RemoveOverlay HttpingOverlay

                    model =
                        Overlay.none
                in
                Overlay.update operation1 model
                    |> Overlay.update operation2
                    |> Overlay.view
                    |> Query.fromHtml
                    |> Query.hasNot [ Slc.class "overlay", Slc.id "overlay--httping" ]
        , test "with AddOverlay on top of another overlay it displays the last added overlay" <|
            \_ ->
                let
                    operation1 =
                        AddOverlay HttpingOverlay

                    operation2 =
                        AddOverlay PopupOverlay

                    model =
                        Overlay.none
                in
                Overlay.update operation1 model
                    |> Overlay.update operation2
                    |> Overlay.view
                    |> Query.fromHtml
                    |> Query.has [ Slc.class "overlay", Slc.id "overlay--popup" ]
        ]

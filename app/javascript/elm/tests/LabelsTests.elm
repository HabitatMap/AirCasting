module LabelsTests exposing (all)

import Fuzz exposing (string)
import Html.Attributes as Attr
import Labels
import Test exposing (..)
import Test.Html.Event as Event
import Test.Html.Query as Query
import Test.Html.Selector as Slc


all : Test
all =
    describe "viewLabels"
        [ fuzz string "lebel area has a description" <|
            \description ->
                Labels.viewLabels Labels.empty description "input-id" (\_ -> Cmd.none) (\_ -> Cmd.none) (\_ -> Cmd.none)
                    |> Query.fromHtml
                    |> Query.has [ Slc.text description ]
        , fuzz string "when user types, updateLabelsSearch is triggered with the input" <|
            \input ->
                let
                    updateLabelsSearch =
                        \_ -> Cmd.none
                in
                Labels.viewLabels Labels.empty "description" "input-id" updateLabelsSearch (\_ -> Cmd.none) (\_ -> Cmd.none)
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "input" ]
                    |> Event.simulate (Event.input input)
                    |> Event.expect (updateLabelsSearch input)
        , fuzz string "candidate is displayed in the search field" <|
            \candidate ->
                let
                    labels =
                        Labels.updateCandidate Labels.empty candidate
                in
                Labels.viewLabels labels "description" "input-id" (\_ -> Cmd.none) (\_ -> Cmd.none) (\_ -> Cmd.none)
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "input" ]
                    |> Query.has [ Slc.attribute <| Attr.value candidate ]
        , fuzz string "label has button that deletes the label" <|
            \label ->
                let
                    labels =
                        Labels.add Labels.empty label

                    removeLabel =
                        \_ -> Cmd.none
                in
                Labels.viewLabels labels "description" "input-id" (\_ -> Cmd.none) removeLabel (\_ -> Cmd.none)
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "button" ]
                    |> Event.simulate Event.click
                    |> Event.expect (removeLabel label)
        ]

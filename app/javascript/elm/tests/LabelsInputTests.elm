module LabelsInputTests exposing (all)

import Fuzz exposing (string)
import Html.Attributes as Attr
import LabelsInput
import Test exposing (..)
import Test.Html.Event as Event
import Test.Html.Query as Query
import Test.Html.Selector as Slc


all : Test
all =
    describe "view"
        [ fuzz string "lebel area has a description" <|
            \description ->
                LabelsInput.view LabelsInput.empty description "input-id" "placeholder"
                    |> Query.fromHtml
                    |> Query.has [ Slc.text description ]
        , fuzz string "when user types, updateLabelsSearch is triggered with the input" <|
            \input ->
                LabelsInput.view LabelsInput.empty "description" "input-id" "placeholder"
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "input" ]
                    |> Event.simulate (Event.input input)
                    |> Event.expect (LabelsInput.UpdateCandidate input)
        , fuzz string "candidate is displayed in the search field" <|
            \candidate ->
                let
                    labels =
                        LabelsInput.withCandidate candidate LabelsInput.empty
                in
                LabelsInput.view labels "description" "input-id" "placeholder"
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "input" ]
                    |> Query.has [ Slc.attribute <| Attr.value candidate ]
        , fuzz string "label has button that deletes the label" <|
            \label ->
                let
                    labels =
                        LabelsInput.fromList [ label ]
                in
                LabelsInput.view labels "description" "input-id" "placeholder"
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "button" ]
                    |> Event.simulate Event.click
                    |> Event.expect (LabelsInput.Remove label)
        ]

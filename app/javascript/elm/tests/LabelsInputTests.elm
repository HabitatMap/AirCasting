module LabelsInputTests exposing (all)

import Fuzz exposing (bool, string)
import Html.Attributes as Attr
import LabelsInput
import Test exposing (..)
import Test.Html.Event as Event
import Test.Html.Query as Query
import Test.Html.Selector as Slc


all : Test
all =
    describe "view"
        [ fuzz string "label area has a description" <|
            \description ->
                LabelsInput.view LabelsInput.empty description "input-id" "placeholder" False
                    |> Query.fromHtml
                    |> Query.has [ Slc.text description ]
        , fuzz bool "label input can be disabled" <|
            \isDisabled ->
                LabelsInput.view LabelsInput.empty "description" "input-id" "placeholder" isDisabled
                    |> Query.fromHtml
                    |> Query.find [ Slc.attribute (Attr.type_ "text") ]
                    |> Query.has [ Slc.attribute (Attr.disabled isDisabled) ]
        , fuzz string "when user types, updateLabelsSearch is triggered with the input" <|
            \input ->
                LabelsInput.view LabelsInput.empty "description" "input-id" "placeholder" False
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
                LabelsInput.view labels "description" "input-id" "placeholder" False
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "input" ]
                    |> Query.has [ Slc.attribute <| Attr.value candidate ]
        , fuzz string "label has button that deletes the label" <|
            \label ->
                let
                    labels =
                        LabelsInput.fromList [ label ]
                in
                LabelsInput.view labels "description" "input-id" "placeholder" False
                    |> Query.fromHtml
                    |> Query.find [ Slc.tag "button" ]
                    |> Event.simulate Event.click
                    |> Event.expect (LabelsInput.Remove label)
        ]

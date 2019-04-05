module Data.SelectedSessionTests exposing (suite)

import Data.SelectedSession exposing (sensorNameFromId)
import Expect
import Fuzz exposing (int, list, string)
import Json.Encode as Encode
import Sensor exposing (..)
import Test exposing (..)


suite : Test
suite =
    describe "Data.SelectedSession"
        [ test "sensorNameFromId" <|
            \_ ->
                let
                    id =
                        "particulate matter-airbeam2-pm2.5 (µg/m3)"

                    expected =
                        "airbeam2-pm2.5"
                in
                sensorNameFromId id
                    |> Expect.equal expected
        ]

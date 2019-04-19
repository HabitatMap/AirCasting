module Data.SelectedSessionTests exposing (suite)

import Data.SelectedSession exposing (..)
import Expect
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

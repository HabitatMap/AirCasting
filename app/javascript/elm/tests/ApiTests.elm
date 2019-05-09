module ApiTests exposing (suite)

import Api
import Expect
import Fuzz exposing (int)
import Test exposing (..)
import TestUtils exposing (defaultSession)


suite : Test
suite =
    describe "Api: "
        [ fuzz int "with 1 session exportLink generates the correct link" <|
            \id ->
                let
                    expected =
                        Api.exportPath ++ "?session_ids[]=" ++ String.fromInt id
                in
                [ { defaultSession | id = id } ]
                    |> Api.exportLink
                    |> Expect.equal expected
        , fuzz int "with 2 sessions exportLink generates the correct link" <|
            \id ->
                let
                    expected =
                        Api.exportPath ++ "?session_ids[]=" ++ String.fromInt id ++ "&session_ids[]=" ++ String.fromInt (id + 1)
                in
                [ { defaultSession | id = id }, { defaultSession | id = id + 1 } ]
                    |> Api.exportLink
                    |> Expect.equal expected
        ]

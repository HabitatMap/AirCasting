module ApiTests exposing (suite)

import Api
import Expect
import Fuzz exposing (int, string)
import Test exposing (..)
import TestUtils exposing (defaultSession)


suite : Test
suite =
    describe "Api: "
        [ fuzz2 int string "with 1 session exportLink generates the correct link" <|
            \id email ->
                let
                    expected =
                        Api.exportPath ++ "?session_ids[]=" ++ String.fromInt id ++ "&email=" ++ email
                in
                [ { defaultSession | id = id } ]
                    |> Api.exportLink email
                    |> Expect.equal expected
        , fuzz2 int string "with 2 sessions exportLink generates the correct link" <|
            \id email ->
                let
                    expected =
                        Api.exportPath ++ "?session_ids[]=" ++ String.fromInt id ++ "&session_ids[]=" ++ String.fromInt (id + 1) ++ "&email=" ++ email
                in
                [ { defaultSession | id = id }, { defaultSession | id = id + 1 } ]
                    |> Api.exportLink email
                    |> Expect.equal expected
        ]

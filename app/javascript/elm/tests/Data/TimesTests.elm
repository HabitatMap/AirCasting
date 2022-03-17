module Data.TimesTests exposing (suite)

import Data.Times exposing (..)
import Expect
import Fuzz exposing (intRange)
import Iso8601
import Test exposing (..)
import Time


suite : Test
suite =
    describe "Data.Times"
        [ fuzz (intRange 1000 3000) "when on different years format returns full dates" <|
            \i ->
                let
                    startYear =
                        String.fromInt i

                    endYear =
                        String.fromInt <| i + 1

                    start =
                        Iso8601.toTime (startYear ++ "-12-31T13:12:00.000Z")
                            |> Result.withDefault (Time.millisToPosix 0)

                    end =
                        Iso8601.toTime (endYear ++ "-12-31T13:12:00.000Z")
                            |> Result.withDefault (Time.millisToPosix 0)

                    expected =
                        "12/31/" ++ String.right 2 startYear ++ " 13:12 - 12/31/" ++ String.right 2 endYear ++ " 13:12"
                in
                format start end
                    |> Expect.equal expected
        , fuzz (intRange 1 11) "when on different months format returns full dates" <|
            \i ->
                let
                    startMonth =
                        String.padLeft 2 '0' <| String.fromInt i

                    endMonth =
                        String.padLeft 2 '0' <| String.fromInt (i + 1)

                    start =
                        Iso8601.toTime ("2000-" ++ startMonth ++ "-28T13:12:00.000Z")
                            |> Result.withDefault (Time.millisToPosix 0)

                    end =
                        Iso8601.toTime ("2000-" ++ endMonth ++ "-28T13:12:00.000Z")
                            |> Result.withDefault (Time.millisToPosix 0)

                    expected =
                        startMonth ++ "/28/00 13:12 - " ++ endMonth ++ "/28/00 13:12"
                in
                format start end
                    |> Expect.equal expected
        , fuzz (intRange 1 30) "when on different days format returns full dates" <|
            \i ->
                let
                    startDay =
                        String.padLeft 2 '0' <| String.fromInt i

                    endDay =
                        String.padLeft 2 '0' <| String.fromInt (i + 1)

                    start =
                        Iso8601.toTime ("2000-01-" ++ startDay ++ "T13:12:00.000Z")
                            |> Result.withDefault (Time.millisToPosix 0)

                    end =
                        Iso8601.toTime ("2000-01-" ++ endDay ++ "T13:12:00.000Z")
                            |> Result.withDefault (Time.millisToPosix 0)

                    expected =
                        "01/" ++ startDay ++ "/00 13:12 - 01/" ++ endDay ++ "/00 13:12"
                in
                format start end
                    |> Expect.equal expected
        , test "when on same dates format returns the full date for start and just time for end" <|
            \_ ->
                let
                    start =
                        Iso8601.toTime "2010-12-31T09:08:00.000Z"
                            |> Result.withDefault (Time.millisToPosix 0)

                    end =
                        Iso8601.toTime "2010-12-31T13:22:00.000Z"
                            |> Result.withDefault (Time.millisToPosix 0)

                    expected =
                        "12/31/10 09:08-13:22"
                in
                format start end
                    |> Expect.equal expected
        ]

module Data.Times exposing (format)

import Time exposing (Month(..), Posix)


format : Posix -> Posix -> String
format start end =
    let
        toFullDate p =
            toMonth p ++ "/" ++ toDay p ++ "/" ++ toYear p ++ " " ++ toTime p

        toTime p =
            toHour p ++ ":" ++ toMinute p

        areOnSameDate p1 p2 =
            toYear p1 == toYear p2 && toMonth p1 == toMonth p2 && toDay p1 == toDay p2

        toYear =
            String.right 2 << String.fromInt << Time.toYear Time.utc

        toMonth =
            monthToString << Time.toMonth Time.utc

        toDay =
            String.padLeft 2 '0' << String.fromInt << Time.toDay Time.utc

        toHour =
            String.padLeft 2 '0' << String.fromInt << Time.toHour Time.utc

        toMinute =
            String.padLeft 2 '0' << String.fromInt << Time.toMinute Time.utc
    in
    toFullDate start
        ++ (if areOnSameDate start end then
                "-" ++ toTime end

            else
                " - " ++ toFullDate end
           )


monthToString : Month -> String
monthToString month =
    case month of
        Jan ->
            "01"

        Feb ->
            "02"

        Mar ->
            "03"

        Apr ->
            "04"

        May ->
            "05"

        Jun ->
            "06"

        Jul ->
            "07"

        Aug ->
            "08"

        Sep ->
            "09"

        Oct ->
            "10"

        Nov ->
            "11"

        Dec ->
            "12"

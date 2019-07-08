module Data.Status exposing (Status(..), default, toBool, toStatus, toggle)


type Status
    = Active
    | Dormant


default : Status
default =
    Active


toStatus : Bool -> Status
toStatus isActive =
    case isActive of
        True ->
            Active

        False ->
            Dormant


toBool : Status -> Bool
toBool status =
    case status of
        Active ->
            True

        Dormant ->
            False


toggle : Status -> Status
toggle status =
    case status of
        Active ->
            Dormant

        Dormant ->
            Active

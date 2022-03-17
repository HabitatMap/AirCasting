module Data.Status exposing (Status(..), default, toBool, toStatus)


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

module Data.Theme exposing (Icons, Theme, default, emptyIcons, getIcon, toIcons, toString, toTheme, toggle)

import Data.Path as Path exposing (Path)


type Theme
    = Default
    | Blue


toggle : Theme -> Theme
toggle theme =
    case theme of
        Default ->
            Blue

        Blue ->
            Default


toString : Theme -> String
toString theme =
    case theme of
        Default ->
            "default"

        Blue ->
            "blue"


toTheme : String -> Theme
toTheme theme =
    case theme of
        "blue" ->
            Blue

        _ ->
            Default


default : Theme
default =
    Default


type Icons
    = Icons
        { default : Path
        , blue : Path
        }


emptyIcons : Icons
emptyIcons =
    Icons
        { default = Path.empty
        , blue = Path.empty
        }


toIcons : String -> String -> Icons
toIcons defaultIcon blueIcon =
    Icons
        { default = Path.fromString defaultIcon
        , blue = Path.fromString blueIcon
        }


getIcon : Theme -> Icons -> Path
getIcon theme (Icons icons) =
    case theme of
        Default ->
            icons.blue

        Blue ->
            icons.default

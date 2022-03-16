module TestUtils exposing
    ( defaultIcon
    , defaultSelectedSession
    , defaultSession
    , heatMapThresholdsWithMaximum
    , heatMapThresholdsWithMinimum
    , simulatedEventObject
    )

import Data.HeatMapThresholds exposing (HeatMapThresholds)
import Data.Path as Path exposing (Path)
import Data.SelectedSession exposing (SelectedSession)
import Data.Session exposing (Session, ShortType)
import Json.Encode as Encode
import Time


simulatedEventObject : String -> Encode.Value
simulatedEventObject value =
    let
        target =
            Encode.object [ ( "value", Encode.string value ) ]
    in
    Encode.object [ ( "target", target ) ]


defaultShortTypes : List ShortType
defaultShortTypes =
    [ { name = "name", type_ = "type_" } ]


defaultSession : Session
defaultSession =
    { title = "title"
    , id = 1
    , startTime = Time.millisToPosix 0
    , endTime = Time.millisToPosix 0
    , username = "username"
    , shortTypes = defaultShortTypes
    , average = Nothing
    , location = defaultLocation
    , streamId = 123
    }


defaultLocation =
    { lng = 0
    , lat = 0
    }


heatMapThresholdsWithMinimum : Int -> HeatMapThresholds
heatMapThresholdsWithMinimum value =
    { threshold1 = { value = value, default = 1 }
    , threshold2 = { value = 2, default = 2 }
    , threshold3 = { value = 3, default = 3 }
    , threshold4 = { value = 4, default = 4 }
    , threshold5 = { value = 5, default = 5 }
    }


heatMapThresholdsWithMaximum : Int -> HeatMapThresholds
heatMapThresholdsWithMaximum value =
    { threshold1 = { value = 1, default = 1 }
    , threshold2 = { value = 2, default = 2 }
    , threshold3 = { value = 3, default = 3 }
    , threshold4 = { value = 4, default = 4 }
    , threshold5 = { value = value, default = 5 }
    }


defaultSelectedSession : SelectedSession
defaultSelectedSession =
    { title = "title"
    , username = "username"
    , sensorName = "sensor-name"
    , measurements = []
    , fetchedStartTime = Nothing
    , startTime = Time.millisToPosix 0
    , endTime = Time.millisToPosix 0
    , id = 123
    , streamId = 123
    , selectedTimeRange = { start = 0.0, end = 0.0 }
    , sensorUnit = "sensorUnit"
    , averageValue = 0
    , longitude = 0
    , latitude = 0
    , maxLatitude = 0
    , maxLongitude = 0
    , minLatitude = 0
    , minLongitude = 0
    , startLatitude = 0
    , startLongitude = 0
    , notes = []
    , isIndoor = False
    , lastMeasurementValue = 0
    }


defaultIcon : Path
defaultIcon =
    Path.fromString "icon.svg"

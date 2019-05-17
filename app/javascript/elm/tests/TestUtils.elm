module TestUtils exposing
    ( defaultSelectedSession
    , defaultSession
    , heatMapThresholdsWithMaximum
    , heatMapThresholdsWithMinimum
    , simulatedEventObject
    )

import Data.HeatMapThresholds exposing (HeatMapThresholds)
import Data.SelectedSession exposing (SelectedSession)
import Data.Session exposing (Session, ShortType)
import Json.Encode as Encode
import Sensor exposing (Sensor)
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
    , startTime = Time.millisToPosix 0
    , endTime = Time.millisToPosix 0
    , id = 123
    , streamId = 123
    , selectedMeasurements = []
    }

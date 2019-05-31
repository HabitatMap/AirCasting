module Tooltip exposing
    ( TooltipText
    , crowdMap
    , fixedTab
    , locationFilter
    , mobileTab
    , parameterFilter
    , profilesFilter
    , sensorFilter
    , streamingToggleFilter
    , tagsFilter
    , timeRangeFilter
    , typeToggleFilter
    , view
    )

import Data.Path as Path exposing (Path)
import Html exposing (Html, div, img, span, text)
import Html.Attributes exposing (alt, attribute, src)


type TooltipText
    = TooltipText String


view : TooltipText -> Path -> Html msg
view (TooltipText tooltipText) tooltipIcon =
    div [ attribute "data-tippy-content" tooltipText ] [ img [ src (Path.toString tooltipIcon), alt "Tooltip icon" ] [] ]


mobileTab =
    TooltipText "The mobile tab displays measurements from mobile sessions. When recording mobile sessions, measurements are created, timestamped, and geolocated once per second. Average values for the duration of the session are displayed inside the session map markers."


fixedTab =
    TooltipText "The fixed tab displays measurements from fixed sessions. When recording fixed sessions, measurements are created and timestamped once per minute and geocoordinates are fixed to a set location. Hourly average values are displayed inside the session map markers. These measurements are updated on the hour."


parameterFilter =
    TooltipText "The parameter field describes the broad category of environmental or physiological measurements being recorded. The AirCasting platform is device agnostic i.e. it will ingest and display data from any instrument that formats and communicates data according to our formatting and communications protocol."


sensorFilter =
    TooltipText "The sensor field describes the specific make and model of the sensor that is creating measurements."


locationFilter =
    TooltipText "Enter an address, intersection, or postal code to pan and zoom the map to that location."


timeRangeFilter =
    TooltipText "Enter a time frame to view sessions that include measurements with corresponding timestamps."


profilesFilter =
    TooltipText "Enter a profile name or names to filter the sessions by profile name."


tagsFilter =
    TooltipText "Enter a tag or tags to filter the sessions by tags. Tags are keywords assigned to sessions."


crowdMap =
    TooltipText "The CrowdMap averages together all the measurements from all the sessions listed on the sessions list and displays these averages as colored grid cells. The color of each grid cell corresponds to the average intensity of all the measurements recorded in that area. Click on a grid cell to view the underlying data."


typeToggleFilter =
    TooltipText "Outdoor sessions are recorded by instruments located outdoors. Indoor measurements are recorded by instruments located indoors. Indoor sessions do not include geocoordinates and are therefore not geolocated on the map."


streamingToggleFilter =
    TooltipText "Fixed sessions that have submitted a measurement in the past hour are considered active. Fixed sessions that have not submitted measurements in the past hour are considered dormant."

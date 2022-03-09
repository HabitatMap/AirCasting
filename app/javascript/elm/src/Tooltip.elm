module Tooltip exposing
    ( TooltipText
    , activeToggleFilter
    , crowdMap
    , fixedTab
    , locationFilter
    , mobileTab
    , parameterFilter
    , profilesFilter
    , sensorFilter
    , tagsFilter
    , timeRangeFilter
    , typeToggleFilter
    , view
    )

import Html exposing (Html, div, span, text)
import Html.Attributes exposing (attribute, class)


type TooltipText
    = TooltipText String


view : TooltipText -> Html msg
view (TooltipText tooltipText) =
    div [ attribute "data-tippy-content" tooltipText ] [ span [ class "tooltip-icon" ] [ text "?" ] ]


mobileTab =
    TooltipText "The mobile tab displays measurements from mobile sessions. When recording mobile sessions, measurements are created, timestamped, and geolocated once per second. Average values for the duration of the session are displayed inside the session map markers."


fixedTab =
    TooltipText "The fixed tab displays measurements from fixed sessions. When recording fixed sessions, geocoordinates are fixed to a set location. The most recent measurement is displayed inside the session map markers."


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


activeToggleFilter =
    TooltipText "Fixed sessions that have submitted a measurement in the past 24 hours are considered active. Fixed sessions that have not submitted measurements in the past 24 hours are considered dormant."

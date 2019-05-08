port module Ports exposing
    ( drawFixed
    , drawMobile
    , findLocation
    , loadMoreSessions
    , locationCleared
    , profileSelected
    , refreshTimeRange
    , selectSensorId
    , showCopyLinkTooltip
    , tagSelected
    , timeRangeSelected
    , toggleCrowdMap
    , toggleIndoor
    , toggleIsSearchOn
    , toggleSession
    , toggleSessionSelection
    , toggleStreaming
    , updateHeatMapThresholds
    , updateHeatMapThresholdsFromAngular
    , updateIsHttping
    , updateProfiles
    , updateResolution
    , updateSessions
    , updateTags
    )

import Data.GraphData exposing (GraphData)
import Data.HeatMapThresholds exposing (HeatMapThresholdValues)
import Data.Session exposing (Session)
import Json.Encode as Encode


port tagSelected : (String -> msg) -> Sub msg


port profileSelected : (String -> msg) -> Sub msg


port timeRangeSelected : (Encode.Value -> msg) -> Sub msg


port locationCleared : (() -> msg) -> Sub msg


port findLocation : String -> Cmd a


port showCopyLinkTooltip : () -> Cmd a


port toggleCrowdMap : Bool -> Cmd a


port toggleIndoor : Bool -> Cmd a


port toggleStreaming : Bool -> Cmd a


port updateResolution : Int -> Cmd a


port selectSensorId : String -> Cmd a


port updateSessions : (Encode.Value -> msg) -> Sub msg


port toggleSession : { deselected : Maybe Int, selected : Maybe Int } -> Cmd msg


port loadMoreSessions : () -> Cmd msg


port updateIsHttping : (Bool -> msg) -> Sub msg


port updateTags : List String -> Cmd a


port updateProfiles : List String -> Cmd a


port toggleSessionSelection : (Maybe Int -> msg) -> Sub msg


port refreshTimeRange : () -> Cmd a


port updateHeatMapThresholds : HeatMapThresholdValues -> Cmd a


port updateHeatMapThresholdsFromAngular : (HeatMapThresholdValues -> msg) -> Sub msg


port drawMobile : GraphData -> Cmd a


port drawFixed : GraphData -> Cmd a


port toggleIsSearchOn : Bool -> Cmd a

module Data.SelectedSession exposing
    ( SelectedSession
    , SelectedSessionForJavaScript
    , fetch
    , fetchMeasurements
    , formatForJavaScript
    , measurementBounds
    , times
    , toStreamId
    , updateFetchedTimeRange
    , updateMeasurements
    , view
    )

import Data.GraphData exposing (GraphMeasurementsData, GraphTimeRange)
import Data.HeatMapThresholds exposing (HeatMapThresholds)
import Data.Measurements as Measurements exposing (Measurement)
import Data.Note as Note exposing (Note)
import Data.Page exposing (Page(..))
import Data.Path as Path exposing (Path)
import Data.Session
import Data.Times as Times
import Html exposing (Html, button, div, img, p, span, text)
import Html.Attributes exposing (alt, class, id, src)
import Html.Events as Events
import Http
import Json.Decode as Decode exposing (Decoder)
import Json.Decode.Pipeline exposing (hardcoded, optional, required)
import Popup
import RemoteData exposing (WebData)
import Time exposing (Posix)
import Url.Builder


type alias SelectedSession =
    { title : String
    , username : String
    , sensorName : String
    , measurements : List Measurement
    , fetchedStartTime : Maybe Float
    , startTime : Posix
    , endTime : Posix
    , id : Int
    , streamId : Int
    , selectedTimeRange : GraphTimeRange
    , sensorUnit : String
    , averageValue : Float
    , latitude : Float
    , longitude : Float
    , maxLatitude : Float
    , maxLongitude : Float
    , minLatitude : Float
    , minLongitude : Float
    , startLatitude : Float
    , startLongitude : Float
    , notes : List Note
    , isIndoor : Bool
    , lastMeasurementValue : Float
    }


type alias SelectedSessionForJavaScript =
    { id : Int
    , notes : List Note
    , stream :
        { average_value : Float
        , max_latitude : Float
        , max_longitude : Float
        , measurements : List Measurement
        , min_latitude : Float
        , min_longitude : Float
        , sensor_name : String
        , start_latitude : Float
        , start_longitude : Float
        , unit_symbol : String
        , id : Int
        }
    , is_indoor : Bool
    , last_measurement_value : Float
    , latitude : Float
    , longitude : Float
    }


formatForJavaScript : SelectedSession -> SelectedSessionForJavaScript
formatForJavaScript session =
    { id = session.id
    , notes = session.notes
    , stream =
        { average_value = session.averageValue
        , max_latitude = session.maxLatitude
        , max_longitude = session.maxLongitude
        , min_latitude = session.minLatitude
        , min_longitude = session.minLongitude
        , start_latitude = session.startLatitude
        , start_longitude = session.startLongitude
        , measurements = session.measurements
        , unit_symbol = session.sensorUnit
        , sensor_name = session.sensorName
        , id = session.streamId
        }
    , is_indoor = session.isIndoor
    , last_measurement_value = session.lastMeasurementValue
    , latitude = session.latitude
    , longitude = session.longitude
    }


times : SelectedSession -> { start : Int, end : Int }
times { startTime, endTime } =
    { start = Time.posixToMillis startTime, end = Time.posixToMillis endTime }


toStreamId : SelectedSession -> Int
toStreamId { streamId } =
    streamId


measurementBounds : SelectedSession -> Maybe { min : Float, max : Float }
measurementBounds session =
    let
        maybeMin =
            List.minimum (selectedMeasurements session.measurements session.selectedTimeRange)

        maybeMax =
            List.maximum (selectedMeasurements session.measurements session.selectedTimeRange)
    in
    case ( maybeMin, maybeMax ) of
        ( Just min, Just max ) ->
            Just { min = min, max = max }

        _ ->
            Nothing


millisToPosixDecoder : Decoder Posix
millisToPosixDecoder =
    Decode.int
        |> Decode.map Time.millisToPosix


decoder : Decoder SelectedSession
decoder =
    Decode.succeed SelectedSession
        |> required "title" Decode.string
        |> required "username" Decode.string
        |> required "sensorName" Decode.string
        |> required "measurements" (Decode.list Measurements.decoder)
        |> hardcoded Nothing
        |> required "startTime" millisToPosixDecoder
        |> required "endTime" millisToPosixDecoder
        |> required "id" Decode.int
        |> required "streamId" Decode.int
        |> hardcoded { start = 0, end = 0 }
        |> required "sensorUnit" Decode.string
        |> optional "averageValue" Decode.float 0
        |> optional "latitude" Decode.float 0
        |> optional "longitude" Decode.float 0
        |> required "maxLatitude" Decode.float
        |> required "maxLongitude" Decode.float
        |> required "minLatitude" Decode.float
        |> required "minLongitude" Decode.float
        |> optional "startLatitude" Decode.float 0
        |> optional "startLongitude" Decode.float 0
        |> required "notes" (Decode.list Note.decoder)
        |> optional "isIndoor" Decode.bool False
        |> optional "lastMeasurementValue" Decode.float 0


fetch : Page -> Int -> (Result Http.Error SelectedSession -> msg) -> Cmd msg
fetch page streamId toCmd =
    Http.get
        { url =
            if page == Mobile then
                Url.Builder.absolute
                    [ "api", "mobile", "streams", String.fromInt streamId ++ ".json" ]
                    []

            else
                Url.Builder.absolute
                    [ "api", "fixed", "streams", String.fromInt streamId ++ ".json" ]
                    [ Url.Builder.int "measurements_limit" 1440 ]
        , expect = Http.expectJson toCmd decoder
        }


updateFetchedTimeRange : SelectedSession -> SelectedSession
updateFetchedTimeRange session =
    { session | fetchedStartTime = session.measurements |> List.map .time |> List.minimum |> Maybe.map toFloat }


fetchMeasurements : SelectedSession -> (Result Http.Error (List Measurement) -> msg) -> (GraphMeasurementsData -> Cmd msg) -> Cmd msg
fetchMeasurements session toCmd cmd =
    let
        newStartTime =
            session.selectedTimeRange.start
    in
    case session.fetchedStartTime of
        Nothing ->
            Measurements.fetch session.streamId toCmd newStartTime session.selectedTimeRange.end

        Just fetchedStartTime ->
            if newStartTime < fetchedStartTime then
                Measurements.fetch session.streamId toCmd newStartTime fetchedStartTime

            else
                cmd
                    { measurements = session.measurements
                    , times = times session
                    }


updateMeasurements : List Measurement -> SelectedSession -> SelectedSession
updateMeasurements measurements session =
    { session
        | measurements = List.append measurements session.measurements
    }
        |> updateFetchedTimeRange


selectedMeasurements : List Measurement -> GraphTimeRange -> List Float
selectedMeasurements allMeasurements selectedTimeRange =
    allMeasurements
        |> List.filter (\measurement -> toFloat measurement.time >= selectedTimeRange.start && toFloat measurement.time <= selectedTimeRange.end)
        |> List.map (\measurement -> measurement.value)


view : SelectedSession -> WebData HeatMapThresholds -> Path -> (String -> msg) -> msg -> Popup.Popup -> Html msg -> Html msg
view session heatMapThresholds linkIcon toMsg showExportPopup popup emailForm =
    let
        tooltipId =
            "graph-copy-link-tooltip"

        measurements =
            selectedMeasurements session.measurements session.selectedTimeRange
    in
    div [ class "single-session__info" ]
        [ div [ class "session-data" ]
            [ div [ class "session-data__left" ]
                [ p [ class "single-session__name" ] [ text session.title ]
                , p [ class "single-session__username" ] [ text session.username ]
                , p [ class "single-session__sensor" ] [ text session.sensorName ]
                ]
            , case measurements of
                [] ->
                    div [ class "single-session__placeholder" ] []

                _ ->
                    let
                        min =
                            List.minimum measurements |> Maybe.withDefault -1

                        max =
                            List.maximum measurements |> Maybe.withDefault -1

                        average =
                            List.sum measurements / toFloat (List.length measurements)
                    in
                    div [ class "session-data__right" ]
                        [ div []
                            [ div [ class "single-session__avg-color", class <| Data.Session.classByValue (Just average) heatMapThresholds ] []
                            , span [] [ text "avg. " ]
                            , span [ class "single-session__avg" ] [ text <| String.fromInt <| round average ]
                            , span [] [ text <| " " ++ session.sensorUnit ]
                            ]
                        , div [ class "session-numbers-container" ]
                            [ div [ class "session-min-max-container" ]
                                [ div [ class "single-session__color", class <| Data.Session.classByValue (Just min) heatMapThresholds ] []
                                , span [] [ text "min. " ]
                                , span [ class "single-session__min" ] [ text <| String.fromInt <| round min ]
                                ]
                            , div [ class "session-min-max-container" ]
                                [ div [ class "single-session__color", class <| Data.Session.classByValue (Just max) heatMapThresholds ] []
                                , span [] [ text "max. " ]
                                , span [ class "single-session__max" ] [ text <| String.fromInt <| round max ]
                                ]
                            ]
                        , div [ class "single-session__date" ]
                            [ text <| Times.format session.startTime session.endTime ]
                        ]
            ]
        , div [ class "action-buttons" ]
            [ button [ class "button button--primary action-button action-button--export", Popup.clickWithoutDefault showExportPopup ] [ text "export session" ]
            , button [ class "button button--primary action-button action-button--copy-link", Events.onClick <| toMsg tooltipId, id tooltipId ] [ img [ src (Path.toString linkIcon), alt "Link icon" ] [] ]
            , if Popup.isEmailFormPopupShown popup then
                emailForm

              else
                text ""
            ]
        ]

import { Marker } from "@googlemaps/markerclusterer";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { mobileStreamPath } from "../../../assets/styles/colors";
import { selectHoverPosition } from "../../../store/mapSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { getColorForValue } from "../../../utils/thresholdColors";
import HoverMarker from "./HoverMarker/HoverMarker";
import { StreamMarker } from "./StreamMarker/StreamMarker";

type Props = {
  sessions: Session[];
  unitSymbol: string;
};

const StreamMarkers = ({ sessions, unitSymbol }: Props) => {
  const map = useMap();
  const [markers, setMarkers] = useState<{ [streamId: string]: Marker | null }>(
    {}
  );
  const thresholds = useSelector(selectThresholds);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const hoverPosition = useSelector(selectHoverPosition);

  // Sort sessions by time
  const sortedSessions = sessions.sort((a, b) => {
    const timeA = a.time ? new Date(a.time.toString()).getTime() : 0;
    const timeB = b.time ? new Date(b.time.toString()).getTime() : 0;
    return timeA - timeB;
  });

  // Update markers when marker references change
  useEffect(() => {
    const newMarkers: { [streamId: string]: Marker | null } = {};
    sessions.forEach((session) => {
      if (!markers[session.point.streamId]) {
        newMarkers[session.point.streamId] = null;
      }
    });
    setMarkers((prev) => ({
      ...prev,
      ...newMarkers,
    }));
  }, [sessions]);

  // Create and update polyline
  useEffect(() => {
    if (!map) return;

    const path = sortedSessions.map((session) => ({
      lat: session.point.lat,
      lng: session.point.lng,
    }));

    if (polylineRef.current) {
      polylineRef.current.setPath(path);
    } else {
      polylineRef.current = new google.maps.Polyline({
        path,
        map,
        strokeColor: mobileStreamPath,
        strokeOpacity: 0.7,
        strokeWeight: 4,
      });
    }

    // Cleanup function to remove the polyline
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null); // Remove the polyline from the map
        polylineRef.current = null; // Cleanup the reference
      }
    };
  }, [sortedSessions, map]);

  return (
    <>
      {sessions.map((session) => (
        <React.Fragment key={session.id}>
          <AdvancedMarker
            title={`${session.lastMeasurementValue} ${unitSymbol}`}
            position={session.point}
            key={`marker-${session.id}`}
            zIndex={0}
            ref={(marker) => {
              if (marker && !markers[session.point.streamId]) {
                setMarkers((prev) => ({
                  ...prev,
                  [session.point.streamId]: marker,
                }));
              }
            }}
          >
            <StreamMarker
              color={getColorForValue(thresholds, session.lastMeasurementValue)}
            />
          </AdvancedMarker>
        </React.Fragment>
      ))}
      {hoverPosition && <HoverMarker position={hoverPosition} />}
    </>
  );
};

export { StreamMarkers };

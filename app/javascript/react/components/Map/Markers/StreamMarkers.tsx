import { Marker } from "@googlemaps/markerclusterer";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { mobileStreamPath, red } from "../../../assets/styles/colors";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { LatLngLiteral } from "../../../types/googleMaps";
import { Session } from "../../../types/sessionType";
import HoverMarker from "./HoverMarker/HoverMarker";
import { StreamMarker } from "./StreamMarker/StreamMarker";
import { StreamMarkerTooltip } from "./StreamMarker/StreamMarker.style";

type Props = {
  sessions: Session[];
  unitSymbol: string;
};

const StreamMarkers = ({ sessions, unitSymbol }: Props) => {
  const map = useMap();
  const [markers, setMarkers] = useState<{ [streamId: string]: Marker | null }>(
    {}
  );
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const hoverStreamId = useSelector(selectHoverStreamId);
  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );

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

  useEffect(() => {
    if (hoverStreamId) {
      const hoveredSession = sessions.find(
        (session) => Number(session.point.streamId) === hoverStreamId
      );

      if (hoveredSession) {
        setHoverPosition(hoveredSession.point);
      }
    } else {
      setHoverPosition(null);
    }
  }, [hoverStreamId, sessions]);

  return (
    <>
      {sessions.map((session) => (
        <React.Fragment key={session.id}>
          {/* #DirtyButWorks Display transparent marker without transform property on top of stream marker to enable tooltip */}
          <AdvancedMarker
            title={`${session.lastMeasurementValue} ${unitSymbol}`}
            position={session.point}
            key={`tooltip-${session.id}`}
            zIndex={1}
            ref={(marker) => {
              if (marker && !markers[session.point.streamId]) {
                setMarkers((prev) => ({
                  ...prev,
                  [session.point.streamId]: marker,
                }));
              }
            }}
          >
            <StreamMarkerTooltip />
          </AdvancedMarker>
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
            <StreamMarker color={red} />
          </AdvancedMarker>
        </React.Fragment>
      ))}
      <HoverMarker position={hoverPosition} />
    </>
  );
};

export { StreamMarkers };

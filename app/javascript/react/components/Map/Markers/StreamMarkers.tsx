import React, { useEffect, useRef, useState } from "react";

import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import { mobileStreamPath, red } from "../../../assets/styles/colors";
import { Session } from "./SessionType";
import { StreamMarker } from "./StreamMarker/StreamMarker";

import type { Marker } from "@googlemaps/markerclusterer";

type Props = {
  sessions: Session[];
};

const StreamMarkers = ({ sessions }: Props) => {
  const map = useMap();
  const [markers, setMarkers] = useState<{ [streamId: string]: Marker | null }>(
    {}
  );
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Sort sessions by time
  const sortedSessions = sessions.sort(
    (a, b) =>
      new Date(a.id.toString()).getTime() - new Date(b.id.toString()).getTime()
  );

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
  }, [sortedSessions, map]);

  return (
    <>
      {sessions.map((session) => (
        <AdvancedMarker
          position={session.point}
          key={session.id}
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
      ))}
    </>
  );
};

export { StreamMarkers };

import React, { useEffect, useState, useRef } from "react";
import { useMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Marker } from "@googlemaps/markerclusterer";
import { LatLngLiteral } from "../../../types/googleMaps";
import { SingleMarker } from "./SingleMarker/SingleMarker";
import { Session } from "./SessionType";

type Props = {
  sessions: Session[];
  onMarkerClick: (sessionId: number) => void;
};

const Markers = ({ sessions, onMarkerClick }: Props) => {
  const map = useMap();
  const [markers, setMarkers] = useState<{ [key: string]: Marker | null }>({});
  const clusterer = useRef<MarkerClusterer | null>(null);
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(
    null
  );
  const ZOOM_FOR_SELECTED_SESSION = 12;

  // Update markers when marker references change
  useEffect(() => {
    const newMarkers: { [key: string]: Marker | null } = {};
    sessions.forEach((session) => {
      if (!markers[session.point.key]) {
        newMarkers[session.point.key] = null;
      }
    });
    setMarkers((prev) => ({
      ...prev,
      ...newMarkers,
    }));
  }, [sessions]);

  // Update MarkerClusterer when markers change
  useEffect(() => {
    if (!clusterer.current || !map) return;

    const validMarkers = Object.values(markers).filter(
      (marker) => marker !== null
    ) as Marker[];
    clusterer.current.clearMarkers();
    clusterer.current.addMarkers(validMarkers);
  }, [markers, map]);

  const centerMapOnMarker = (position: LatLngLiteral, key: string) => {
    if (map) {
      map.setCenter(position);
      map.setZoom(ZOOM_FOR_SELECTED_SESSION);
    }
    setSelectedMarkerKey(key === selectedMarkerKey ? null : key);
  };

  return (
    <>
      {sessions.map((session) => (
        <AdvancedMarker
          position={session.point}
          key={session.point.key}
          ref={(marker) => {
            if (marker && !markers[session.point.key]) {
              setMarkers((prev) => ({
                ...prev,
                [session.point.key]: marker,
              }));
            }
          }}
        >
          <SingleMarker
            color="#E95F5F"
            value={`${session.lastMeasurementValue} µg/m³`}
            isSelected={session.point.key === selectedMarkerKey}
            onClick={() => {
              centerMapOnMarker(session.point, session.point.key);
              onMarkerClick(session.id);
            }}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

export { Markers };

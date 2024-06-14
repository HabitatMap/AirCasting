import React, { useEffect, useRef, useState } from "react";

import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import { LatLngLiteral } from "../../../types/googleMaps";
import { Session } from "../../../types/sessionType";
import { SingleMarker } from "./SingleMarker/SingleMarker";

import type { Marker } from "@googlemaps/markerclusterer";

type Props = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
};

const FixedMarkers = ({ sessions, onMarkerClick, selectedStreamId }: Props) => {
  const map = useMap();
  const [markers, setMarkers] = useState<{ [streamId: string]: Marker | null }>(
    {}
  );
  const clusterer = useRef<MarkerClusterer | null>(null);
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(
    null
  );
  const ZOOM_FOR_SELECTED_SESSION = 15;

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

  // Update MarkerClusterer when markers change
  useEffect(() => {
    if (!clusterer.current || !map) return;

    const validMarkers = Object.values(markers).filter(
      (marker) => marker !== null
    ) as Marker[];
    clusterer.current.clearMarkers();
    clusterer.current.addMarkers(validMarkers);
  }, [markers, map]);

  const centerMapOnMarker = (position: LatLngLiteral, streamId: string) => {
    if (map) {
      map.setCenter(position);
      map.setZoom(ZOOM_FOR_SELECTED_SESSION);
    }
    setSelectedMarkerKey(streamId === selectedMarkerKey ? null : streamId);
  };

  useEffect(() => {
    if (selectedStreamId === null) {
      setSelectedMarkerKey(null);
    }
  }, [selectedStreamId]);

  return (
    <>
      {sessions.map((session) => (
        <AdvancedMarker
          position={session.point}
          key={session.point.streamId}
          ref={(marker) => {
            if (marker && !markers[session.point.streamId]) {
              setMarkers((prev) => ({
                ...prev,
                [session.point.streamId]: marker,
              }));
            }
          }}
        >
          <SingleMarker
            color="#E95F5F"
            value={`${Math.round(session.lastMeasurementValue)} µg/m³`}
            isSelected={session.point.streamId === selectedMarkerKey}
            onClick={() => {
              onMarkerClick(Number(session.point.streamId), Number(session.id));
              centerMapOnMarker(session.point, session.point.streamId);
            }}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

export { FixedMarkers };

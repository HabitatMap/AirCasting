import React, { useEffect, useState, useRef } from "react";
import { useMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Marker } from "@googlemaps/markerclusterer";
import { LatLngLiteral } from "../../../types/googleMaps";
import { SingleMarker } from "./SingleMarker";
import { Session } from "./SessionType";

type Props = { sessions: Session[] };

const Markers = ({ sessions }: Props) => {
  const map = useMap();
  const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});
  const clusterer = useRef<MarkerClusterer | null>(null);
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(
    null
  );
  const ZOOM_FOR_SELECTED_SESSION = 12;

  // Initialize MarkerClusterer
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  // Update markers
  useEffect(() => {
    clusterer.current?.clearMarkers();
    clusterer.current?.addMarkers(Object.values(markers));
  }, [markers]);

  const setMarkerRef = (marker: Marker | null, key: string) => {
    if (marker && markers[key]) return;
    if (!marker && !markers[key]) return;

    setMarkers((prev) => {
      if (marker) {
        return { ...prev, [key]: marker };
      } else {
        const newMarkers = { ...prev };
        delete newMarkers[key];
        return newMarkers;
      }
    });
  };

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
          ref={(marker) => setMarkerRef(marker, session.point.key)}
        >
          <SingleMarker
            color="red"
            value={`${session.lastMeasurementValue} µg/m³`}
            isSelected={session.point.key === selectedMarkerKey}
            onClick={() => {
              centerMapOnMarker(session.point, session.point.key);
            }}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

export { Markers };

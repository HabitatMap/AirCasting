import React, { useEffect, useState, useRef } from "react";
import { useMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Marker } from "@googlemaps/markerclusterer";
import { LatLngLiteral } from "../../../types/googleMaps";
import { SingleMarker } from "./SingleMarker";

type Point = LatLngLiteral & { key: string };
type Props = { points: Point[] };

const Markers = ({ points }: Props) => {
  const map = useMap();
  const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});
  const clusterer = useRef<MarkerClusterer | null>(null);
  const ZOOM_FOR_SELECTED_SESSION = 15;
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

  const centerMapOnMarker = (position: LatLngLiteral) => {
    if (map) {
      map.setCenter(position);
      map.setZoom(ZOOM_FOR_SELECTED_SESSION);
    }
  };

  return (
    <>
      {points.map((point) => (
        <AdvancedMarker
          position={point}
          key={point.key}
          ref={(marker) => setMarkerRef(marker, point.key)}
        >
          <SingleMarker
            color="red"
            value={"1242 µg/m³"}
            isSelected={false}
            onClick={() => centerMapOnMarker(point)}
          />{" "}
          {/* The props are MOCKED - change them!! */}
        </AdvancedMarker>
      ))}
    </>
  );
};

export { Markers };

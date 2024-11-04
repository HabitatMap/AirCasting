import { useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useRef } from "react";
import { blue } from "../../../../assets/styles/colors";
import { LatLngLiteral } from "../../../../types/googleMaps";
import { CustomMarker } from "../CustomMarker";

interface HoverMarkerProps {
  position: LatLngLiteral | null;
}

const HoverMarker: React.FC<HoverMarkerProps> = ({ position }) => {
  const map = useMap();
  const markerRef = useRef<CustomMarker | null>(null);
  const HOVER_MARKER_Z_INDEX = 3;

  useEffect(() => {
    if (!map || !position) return;

    if (!markerRef.current) {
      markerRef.current = new CustomMarker(
        position,
        `${blue}`,
        "Hover Marker",
        16,
        20,
        "floatPane",
        undefined,
        undefined
      );
      markerRef.current.setMap(map);
      markerRef.current.setZIndex(HOVER_MARKER_Z_INDEX);
    } else {
      markerRef.current.setPosition(position);
      markerRef.current.setZIndex(HOVER_MARKER_Z_INDEX);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [map, position]);

  return null;
};

export default HoverMarker;

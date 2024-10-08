import { useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useRef } from "react";
import { LatLngLiteral } from "../../../../types/googleMaps";
import { CustomMarker } from "../CustomMarker";

import { blue } from "../../../../assets/styles/colors";
interface HoverMarkerProps {
  position: LatLngLiteral | null;
}

const HoverMarker: React.FC<HoverMarkerProps> = ({ position }) => {
  const map = useMap();
  const markerRef = useRef<CustomMarker | null>(null);

  useEffect(() => {
    if (!map || !position) return;

    if (!markerRef.current) {
      markerRef.current = new CustomMarker(
        position,
        `${blue}`,
        "Hover Marker",
        16
      );
      markerRef.current.setMap(map);
    } else {
      markerRef.current.setPosition(position);
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

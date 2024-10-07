import { useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useRef } from "react";
import { blue } from "../../../../assets/styles/colors";
import { LatLngLiteral } from "../../../../types/googleMaps";

interface HoverMarkerProps {
  position: LatLngLiteral | null;
}

const HoverMarker: React.FC<HoverMarkerProps> = ({ position }) => {
  const map = useMap();
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    // Create or update marker
    if (map && position) {
      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          map,
          zIndex: Number(google.maps.Marker.MAX_ZINDEX + 2),
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: blue,
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 8,
          },
        });
      }
      markerRef.current.setPosition(position);
    } else {
      // Remove marker if there's no position or map
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    }

    // Cleanup function
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

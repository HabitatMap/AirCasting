import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React from "react";
import { LatLngLiteral } from "../../../../types/googleMaps";
import * as S from "./HoverMarker.style";

interface HoverMarkerProps {
  position: LatLngLiteral | null;
}

const HoverMarker: React.FC<HoverMarkerProps> = ({ position }) => {
  if (!position) return null;

  return (
    <AdvancedMarker
      position={position}
      zIndex={Number(google.maps.Marker.MAX_ZINDEX + 2)}
    >
      <S.MarkerCircle />
    </AdvancedMarker>
  );
};

export default HoverMarker;

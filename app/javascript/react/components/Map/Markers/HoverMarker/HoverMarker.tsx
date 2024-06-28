import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React from "react";
import { LatLngLiteral } from "../../../../types/googleMaps";
import * as S from "./HoverMarker.style";

interface HoverMarkerProps {
  position: LatLngLiteral | null;
  fixedSessionTypeSelected: boolean;
}

const HoverMarker: React.FC<HoverMarkerProps> = ({
  position,
  fixedSessionTypeSelected = false,
}) => {
  if (!position) return null;

  return (
    <AdvancedMarker
      position={position}
      zIndex={Number(google.maps.Marker.MAX_ZINDEX + 2)}
    >
      <S.MarkerCircle $fixedSessionTypeSelected={fixedSessionTypeSelected} />
    </AdvancedMarker>
  );
};

export default HoverMarker;

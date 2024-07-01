import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React from "react";
import { blue } from "../../../../assets/styles/colors";
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
      <S.MarkerCircle
        $fixedSessionTypeSelected={fixedSessionTypeSelected}
        viewBox="0 0 16 16"
      >
        <circle cx="8" cy="8" r="8" fill={blue} />
      </S.MarkerCircle>
    </AdvancedMarker>
  );
};

export default HoverMarker;

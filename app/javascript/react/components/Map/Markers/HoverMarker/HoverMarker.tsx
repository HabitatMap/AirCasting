import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React from "react";
import { LatLngLiteral } from "../../../../types/googleMaps";
import * as S from "./HoverMarker.style";

type HoverMarkerProps = {
  position: LatLngLiteral | null;
};

const HoverMarker: React.FC<HoverMarkerProps> = ({ position }) => {
  if (!position) return null;

  return (
    <AdvancedMarker position={position} style={{ color: "blue" }}>
      <S.MarkerContainer>
        <S.MarkerCircle />
      </S.MarkerContainer>
    </AdvancedMarker>
  );
};

export default HoverMarker;

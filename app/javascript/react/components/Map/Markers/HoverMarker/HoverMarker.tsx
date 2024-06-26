import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React from "react";
import { blue } from "../../../../assets/styles/colors";
import { LatLngLiteral } from "../../../../types/googleMaps";
import { StreamMarker } from "../StreamMarker/StreamMarker";

type HoverMarkerProps = {
  position: LatLngLiteral | null;
};

const HoverMarker: React.FC<HoverMarkerProps> = ({ position }) => {
  if (!position) return null;

  return (
    <AdvancedMarker position={position} zIndex={100}>
      {/* <S.MarkerContainer>
        <S.MarkerCircle />
      </S.MarkerContainer> */}
      <StreamMarker color={blue} />
    </AdvancedMarker>
  );
};

export default HoverMarker;

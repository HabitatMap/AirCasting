import React from "react";
import {
  ClusterCircle,
  ClusterInfoContainer,
  ClusterInfoText,
  DataContainer,
  ShadowCircle,
} from "./ClusterInfo.style";
import { ClusterZoomIn } from "../ClusterZoomIn/ClusterZoomIn";

interface ClusterProps {
  color: string;
  value: string;
  handleZoomIn: () => void;
}
const ClusterInfo = ({ color, value, handleZoomIn }: ClusterProps) => {
  return (
    <>
      <ClusterInfoContainer $color={color}>
        <ShadowCircle $color={color} />
        <DataContainer>
          <ClusterCircle $color={color} />
          <ClusterInfoText> {value}</ClusterInfoText>
        </DataContainer>
      </ClusterInfoContainer>
      <ClusterZoomIn handleZoomIn={handleZoomIn} />
    </>
  );
};

export { ClusterInfo };

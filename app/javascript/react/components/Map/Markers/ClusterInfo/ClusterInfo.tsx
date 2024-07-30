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
  shouldPulse?: boolean;
  onClick: () => void;
  handleZoomIn: () => void;
}
const ClusterInfo = ({
  color,
  value,
  shouldPulse = false,
  onClick,
  handleZoomIn,
}: ClusterProps) => {
  return (
    <>
      <ClusterInfoContainer onClick={onClick}>
        <ShadowCircle color={color} $shouldPulse={shouldPulse} />
        <DataContainer>
          <ClusterCircle color={color} />
          <ClusterInfoText> {value}</ClusterInfoText>
        </DataContainer>
      </ClusterInfoContainer>
      <ClusterZoomIn handleZoomIn={handleZoomIn} />
    </>
  );
};

export { ClusterInfo };

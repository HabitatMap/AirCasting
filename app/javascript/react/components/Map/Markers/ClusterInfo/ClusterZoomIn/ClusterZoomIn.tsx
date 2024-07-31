import React from "react";

import { ZoomInContainer } from "./ClusterZoomIn.style";
import useScreenSizeDetection from "../../../../../utils/useScreenSizeDetection";
import { ZoomInIcon } from "./ZoomInIcon/ZoomInIcon";

interface ClusterZoomInProps {
  handleZoomIn: () => void;
  color?: string;
}

const ClusterZoomIn = ({ handleZoomIn, color }: ClusterZoomInProps) => {
  const isMobile = useScreenSizeDetection();

  return (
    <ZoomInContainer
      onClick={handleZoomIn}
      onTouchEnd={handleZoomIn}
      $isMobile={isMobile}
    >
      <ZoomInIcon color={color} />
    </ZoomInContainer>
  );
};

export { ClusterZoomIn };

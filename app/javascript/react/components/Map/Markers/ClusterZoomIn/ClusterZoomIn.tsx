import React from "react";
import { useTranslation } from "react-i18next";

import magnifyingGlass from "../../../../assets/icons/magnifyingGlass.svg";
import { ZoomInContainer } from "./ClusterZoomIn.style";

interface ClusterZoomInProps {
  handleZoomIn: () => void;
}

const ClusterZoomIn = ({ handleZoomIn }: ClusterZoomInProps) => {
  const altText = "Zoom in the cluster";
  const { t } = useTranslation();

  return (
    <ZoomInContainer onClick={handleZoomIn}>
      <img src={magnifyingGlass} alt={altText} />
    </ZoomInContainer>
  );
};

export { ClusterZoomIn };

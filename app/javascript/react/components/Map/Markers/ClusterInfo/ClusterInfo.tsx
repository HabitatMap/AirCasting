import React from "react";
import {
  ClusterCircle,
  ClusterInfoBoldText,
  ClusterInfoColorText,
  ClusterInfoContainer,
  ClusterInfoDataAndZoomIn,
  ClusterInfoText,
  DataContainer,
  ShadowCircle,
} from "./ClusterInfo.style";
import { ClusterZoomIn } from "../ClusterZoomIn/ClusterZoomIn";
import { useTranslation } from "react-i18next";

interface ClusterProps {
  color: string;
  average: number;
  numberOfSessions: number;
  handleZoomIn: () => void;
  position: { top: number; left: number };
}

const ClusterInfo = ({
  color,
  average,
  numberOfSessions,
  handleZoomIn,
  position,
}: ClusterProps) => {
  const { t } = useTranslation();
  return (
    <>
      <ClusterInfoContainer
        $color={color}
        $top={position.top}
        $left={position.left}
      >
        <ShadowCircle $color={color} />
        <ClusterInfoDataAndZoomIn>
          <DataContainer $color={color}>
            <ClusterCircle $color={color} />
            <ClusterInfoText>
              <ClusterInfoColorText $color={color}>
                {numberOfSessions} {t("map.clusterInfo.stations")}
              </ClusterInfoColorText>
              {" - "}
              <ClusterInfoBoldText>{average.toFixed(0)}</ClusterInfoBoldText>
              {` ${t("map.clusterInfo.units")} ${t("map.clusterInfo.average")}`}
            </ClusterInfoText>
          </DataContainer>
          <ClusterZoomIn handleZoomIn={handleZoomIn} />
        </ClusterInfoDataAndZoomIn>
      </ClusterInfoContainer>
    </>
  );
};

export { ClusterInfo };

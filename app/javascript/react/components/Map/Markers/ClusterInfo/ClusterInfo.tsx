import React from "react";
import {
  ClusterCircle,
  ClusterInfoBoldText,
  ClusterInfoColorText,
  ClusterInfoContainer,
  ClusterInfoDataAndZoomIn,
  ClusterInfoText,
  DataContainer,
  MobileClusterInfoColorText,
  MobileClusterInfoText,
  MobileDataContainer,
  ShadowCircle,
} from "./ClusterInfo.style";
import { ClusterZoomIn } from "./ClusterZoomIn/ClusterZoomIn";
import { useTranslation } from "react-i18next";
import useScreenSizeDetection from "../../../../utils/useScreenSizeDetection";

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
  const isMobile = useScreenSizeDetection();

  return (
    <>
      <ClusterInfoContainer
        $color={color}
        $top={position.top}
        $left={position.left}
        $isMobile={isMobile}
      >
        <ShadowCircle $color={color} $isMobile={isMobile} />
        {isMobile ? (
          <MobileDataContainer $color={color}>
            <MobileClusterInfoText>
              <MobileClusterInfoColorText $color={color}>
                {numberOfSessions} {t("map.clusterInfo.stations")}
              </MobileClusterInfoColorText>
              {average.toFixed(0)} {` ${t("map.clusterInfo.units")}`}
            </MobileClusterInfoText>
            <ClusterZoomIn handleZoomIn={handleZoomIn} color={color} />
          </MobileDataContainer>
        ) : (
          <ClusterInfoDataAndZoomIn>
            <DataContainer $color={color}>
              <ClusterCircle $color={color} />
              <ClusterInfoText>
                <ClusterInfoColorText $color={color}>
                  {numberOfSessions} {t("map.clusterInfo.stations")}
                </ClusterInfoColorText>
                {" - "}
                <ClusterInfoBoldText>{average.toFixed(0)}</ClusterInfoBoldText>
                {` ${t("map.clusterInfo.units")} ${t(
                  "map.clusterInfo.average"
                )}`}
              </ClusterInfoText>
            </DataContainer>
            <ClusterZoomIn handleZoomIn={handleZoomIn} />
          </ClusterInfoDataAndZoomIn>
        )}
      </ClusterInfoContainer>
    </>
  );
};

export { ClusterInfo };

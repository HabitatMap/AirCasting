import React from "react";
import { useTranslation } from "react-i18next";

import { useMapParams } from "../../../../utils/mapParamsHandler";
import useScreenSizeDetection from "../../../../utils/useScreenSizeDetection";
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

interface ClusterProps {
  color: string;
  average: number;
  numberOfSessions: number;
  handleZoomIn: () => void;
  position: { top: number; left: number };
  visible: boolean;
}

const ClusterInfo = ({
  color,
  average,
  numberOfSessions,
  handleZoomIn,
  position,
  visible,
}: ClusterProps) => {
  const { unitSymbol } = useMapParams();
  const isMobile = useScreenSizeDetection();
  const { t } = useTranslation();

  return (
    <>
      <ClusterInfoContainer
        $color={color}
        $top={position.top}
        $left={position.left}
        $isMobile={isMobile}
        $visible={visible}
      >
        <ShadowCircle $color={color} $isMobile={isMobile} />
        {isMobile ? (
          <MobileDataContainer $color={color}>
            <MobileClusterInfoText>
              <MobileClusterInfoColorText $color={color}>
                {numberOfSessions} {t("map.clusterInfo.stations")}
              </MobileClusterInfoColorText>
              {average.toFixed(0)}{" "}
              {` ${unitSymbol} ${t("map.clusterInfo.average")}`}
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
                {` ${unitSymbol} ${t("map.clusterInfo.average")}`}
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

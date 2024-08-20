import React from "react";
import { useTranslation } from "react-i18next";

import { useMapParams } from "../../../../utils/mapParamsHandler";
import useScreenSizeDetection from "../../../../utils/useScreenSizeDetection";
import {
  DataContainer,
  MobileDataContainer,
  MobileRectangleInfoColorText,
  MobileRectangleInfoText,
  RectangleCircle,
  RectangleInfoBoldText,
  RectangleInfoColorText,
  RectangleInfoContainer,
  RectangleInfoDataAndZoomIn,
  RectangleInfoText,
  ShadowCircle,
} from "./RectangleInfo.style";

interface RectangleProps {
  color: string;
  average: number;
  numberOfSessions: number;
  visible: boolean;
}

const RectangleInfo = ({
  color,
  average,
  numberOfSessions,
  visible,
}: RectangleProps) => {
  const { unitSymbol } = useMapParams();
  const isMobile = useScreenSizeDetection();
  const { t } = useTranslation();

  return (
    <>
      <RectangleInfoContainer
        $color={color}
        $isMobile={isMobile}
        $visible={visible}
      >
        <ShadowCircle $color={color} $isMobile={isMobile} />
        {isMobile ? (
          <MobileDataContainer $color={color}>
            <MobileRectangleInfoText>
              <MobileRectangleInfoColorText $color={color}>
                {numberOfSessions} {t("map.rectangleInfo.stations")}
              </MobileRectangleInfoColorText>
              {average.toFixed(0)}{" "}
              {` ${unitSymbol} ${t("map.rectangleInfo.average")}`}
            </MobileRectangleInfoText>
          </MobileDataContainer>
        ) : (
          <RectangleInfoDataAndZoomIn>
            <DataContainer $color={color}>
              <RectangleCircle $color={color} />
              <RectangleInfoText>
                <RectangleInfoColorText $color={color}>
                  {numberOfSessions} {t("map.rectangleInfo.stations")}
                </RectangleInfoColorText>
                {" - "}
                <RectangleInfoBoldText>
                  {average.toFixed(0)}
                </RectangleInfoBoldText>
                {` ${unitSymbol} ${t("map.rectangleInfo.average")}`}
              </RectangleInfoText>
            </DataContainer>
          </RectangleInfoDataAndZoomIn>
        )}
      </RectangleInfoContainer>
    </>
  );
};

export { RectangleInfo };

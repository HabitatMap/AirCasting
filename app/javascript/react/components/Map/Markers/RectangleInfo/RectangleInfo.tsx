import React from "react";
import { useTranslation } from "react-i18next";

import { useMapParams } from "../../../../utils/mapParamsHandler";
import useScreenSizeDetection from "../../../../utils/useScreenSizeDetection";
import {
  DataContainer,
  RectangleCircle,
  RectangleInfoBoldText,
  RectangleInfoColorText,
  RectangleInfoContainer,
  RectangleInfoHeader,
  RectangleInfoText,
  ShadowCircle,
} from "./RectangleInfo.style";

interface RectangleProps {
  color: string;
  average: number;
  numberOfContributors: number;
  numberOfSamples: number;
  visible: boolean;
}

const RectangleInfo = ({
  color,
  average,
  numberOfContributors,
  numberOfSamples,
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
        <DataContainer $color={color}>
          <RectangleInfoHeader>
            <RectangleCircle $color={color} />
            <RectangleInfoColorText $color={color}>
              {`${t("map.rectangleInfo.average")} ${average.toFixed(
                0
              )} ${unitSymbol} `}
            </RectangleInfoColorText>
          </RectangleInfoHeader>
          <RectangleInfoText>
            <RectangleInfoBoldText>{numberOfSamples}</RectangleInfoBoldText>
            {` ${t("map.rectangleInfo.measurements")}`}
          </RectangleInfoText>
          <RectangleInfoText>
            <RectangleInfoBoldText>
              {numberOfContributors}
            </RectangleInfoBoldText>
            {` ${t("map.rectangleInfo.contributors")}`}
          </RectangleInfoText>
        </DataContainer>
      </RectangleInfoContainer>
    </>
  );
};

export { RectangleInfo };

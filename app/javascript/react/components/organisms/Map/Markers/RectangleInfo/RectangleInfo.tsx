import React from "react";
import { useTranslation } from "react-i18next";

import { grey } from "../../../../../assets/styles/colors";
import { RectangleData } from "../../../../../store/rectangleSlice";
import { useMapParams } from "../../../../../utils/mapParamsHandler";
import {
  DataContainer,
  RectangleCircle,
  RectangleInfoBoldText,
  RectangleInfoColorText,
  RectangleInfoContainer,
  RectangleInfoHeader,
  RectangleInfoText,
} from "./RectangleInfo.style";

interface RectangleProps {
  color: string;
  rectangleData: RectangleData;
}

const RectangleInfo = ({ color, rectangleData }: RectangleProps) => {
  const { unitSymbol } = useMapParams();
  const { t } = useTranslation();
  const { average, numberOfSamples, numberOfContributors } = rectangleData;

  return (
    <RectangleInfoContainer>
      <DataContainer $color={color}>
        <RectangleInfoHeader>
          <RectangleCircle $color={color} />
          <RectangleInfoBoldText>
            {`${t("map.rectangleInfo.average")} ${average.toFixed(
              0
            )} ${unitSymbol} `}
          </RectangleInfoBoldText>
        </RectangleInfoHeader>
        <RectangleInfoText>
          {numberOfSamples}
          {` ${t("map.rectangleInfo.measurements")}`}
        </RectangleInfoText>
        <RectangleInfoText>
          {numberOfContributors}
          {` ${t("map.rectangleInfo.contributors")}`}
        </RectangleInfoText>
      </DataContainer>
    </RectangleInfoContainer>
  );
};

const RectangleInfoLoading = () => {
  const { t } = useTranslation();

  return (
    <RectangleInfoContainer>
      <DataContainer $color={grey} $loading={true}>
        <RectangleInfoHeader $loading={true}>
          <RectangleCircle $color={grey} />
          <RectangleInfoColorText $color={grey}>
            {`${t("map.rectangleInfo.loading")}`}
          </RectangleInfoColorText>
        </RectangleInfoHeader>
      </DataContainer>
    </RectangleInfoContainer>
  );
};

export { RectangleInfo, RectangleInfoLoading };

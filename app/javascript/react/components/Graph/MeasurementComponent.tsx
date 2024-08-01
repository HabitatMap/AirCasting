import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  selectFixedExtremes,
  selectFixedStreamShortInfo,
} from "../../store/fixedStreamSelectors";
import { selectThresholds } from "../../store/thresholdSlice";
import { getColorForValue } from "../../utils/thresholdColors";
import * as S from "../Modals/SessionDetailsModal/SessionDetailsModal.style";
import { MeasurementContainer } from "./Graph.style";

const MeasurementComponent: React.FC = () => {
  const { t } = useTranslation();

  const extremes = useSelector(selectFixedExtremes);
  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useSelector(selectFixedStreamShortInfo);

  const { minMeasurementValue, maxMeasurementValue, averageValue } = extremes;

  return (
    <MeasurementContainer>
      <S.AverageValueContainer>
        <S.AverageDot $color={getColorForValue(thresholds, averageValue)} />
        {t("sessionDetailsModal.averageValue")}
        <S.AverageValue>{averageValue}</S.AverageValue>
        {unitSymbol}
      </S.AverageValueContainer>
      <S.MinMaxValueContainer $isMobile={false}>
        <div>
          <S.SmallDot
            $color={getColorForValue(thresholds, minMeasurementValue)}
          />
          {t("sessionDetailsModal.minValue")}
          <S.Value>{minMeasurementValue}</S.Value>
        </div>
        <div>
          <S.SmallDot
            $color={getColorForValue(thresholds, maxMeasurementValue)}
          />
          {t("sessionDetailsModal.maxValue")}
          <S.Value>{maxMeasurementValue}</S.Value>
        </div>
      </S.MinMaxValueContainer>
    </MeasurementContainer>
  );
};

export default MeasurementComponent;

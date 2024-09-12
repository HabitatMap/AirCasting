import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  selectFixedExtremes,
  selectFixedStreamShortInfo,
} from "../../store/fixedStreamSelectors";
import { useAppSelector } from "../../store/hooks";
import { selectThresholds } from "../../store/thresholdSlice";
import { isNoData } from "../../utils/measurementsCalc";
import { getColorForValue } from "../../utils/thresholdColors";
import * as S from "../Modals/SessionDetailsModal/SessionDetailsModal.style";
import { MeasurementContainer } from "./Graph.style";

const MeasurementComponent: React.FC = () => {
  const { t } = useTranslation();

  const extremes = useAppSelector(selectFixedExtremes);
  const thresholds = useAppSelector(selectThresholds);
  const { unitSymbol } = useAppSelector(selectFixedStreamShortInfo);

  const { minMeasurementValue, maxMeasurementValue, averageValue } = extremes;

  const averageValueColor = useMemo(
    () => getColorForValue(thresholds, averageValue),
    [thresholds, averageValue]
  );
  const minMeasurementValueColor = useMemo(
    () => getColorForValue(thresholds, minMeasurementValue),
    [thresholds, minMeasurementValue]
  );
  const maxMeasurementValueColor = useMemo(
    () => getColorForValue(thresholds, maxMeasurementValue),
    [thresholds, maxMeasurementValue]
  );

  const noData = isNoData(
    extremes.minMeasurementValue,
    extremes.maxMeasurementValue,
    extremes.averageValue
  );

  return (
    <MeasurementContainer>
      {noData ? (
        <S.NoData>{t("sessionDetailsModal.noData")}</S.NoData>
      ) : (
        <>
          <S.AverageValueContainer>
            <S.AverageDot $color={averageValueColor} />
            {t("sessionDetailsModal.averageValue")}
            <S.AverageValue>{averageValue}</S.AverageValue>
            {unitSymbol}
          </S.AverageValueContainer>
          <S.MinMaxValueContainer $isMobile={false}>
            <div>
              <S.SmallDot $color={minMeasurementValueColor} />
              {t("sessionDetailsModal.minValue")}
              <S.Value>{minMeasurementValue}</S.Value>
            </div>
            <div>
              <S.SmallDot $color={maxMeasurementValueColor} />
              {t("sessionDetailsModal.maxValue")}
              <S.Value>{maxMeasurementValue}</S.Value>
            </div>
          </S.MinMaxValueContainer>
        </>
      )}
    </MeasurementContainer>
  );
};

export default MeasurementComponent;

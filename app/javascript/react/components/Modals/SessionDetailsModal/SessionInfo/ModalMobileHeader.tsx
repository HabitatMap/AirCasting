import React from "react";
import { useTranslation } from "react-i18next";
import toggleIcon from "../../../../assets/icons/toggleIcon.svg";
import { MobileStreamShortInfo as StreamShortInfo } from "../../../../types/mobileStream";
import { Thresholds } from "../../../../types/thresholds";
import { isNoData } from "../../../../utils/measurementsCalc";
import { getColorForValue } from "../../../../utils/thresholdColors";
import * as S from "../SessionDetailsModal.style";

interface Extremes {
  minMeasurementValue: number | null;
  maxMeasurementValue: number | null;
  averageValue: number | null;
}

interface ModalMobileHeaderProps {
  toggleVisibility: () => void;
  isVisible: boolean;
  streamShortInfo: StreamShortInfo;
  thresholds: Thresholds;
  extremes: Extremes;
  isMobile: boolean;
  formattedTime: (time: string) => string;
}

const ModalMobileHeader: React.FC<ModalMobileHeaderProps> = ({
  toggleVisibility,
  isVisible,
  streamShortInfo,
  thresholds,
  extremes,
  isMobile,
  formattedTime,
}) => {
  const { t } = useTranslation();

  const { minMeasurementValue, maxMeasurementValue, averageValue } = extremes;
  const noData = isNoData(
    minMeasurementValue,
    maxMeasurementValue,
    averageValue
  );
  return (
    <S.ModalMobileHeader>
      <S.HeaderWrapper onClick={toggleVisibility}>
        <S.ClickableWrapper>
          <S.RotatedIcon
            src={toggleIcon}
            alt={t("headerToggle.arrowIcon")}
            rotated={!isVisible}
            onClick={toggleVisibility}
          />
          <S.SessionName>{streamShortInfo.title}</S.SessionName>
        </S.ClickableWrapper>
        <S.Wrapper>
          {noData ? (
            <S.NoData>{t("sessionDetailsModal.noData")}</S.NoData>
          ) : (
            <S.AverageValueContainer>
              <S.AverageDot
                $color={getColorForValue(thresholds, averageValue)}
              />
              {t("sessionDetailsModal.averageValue")}
              <S.AverageValue>{averageValue}</S.AverageValue>
              {streamShortInfo.unitSymbol}
            </S.AverageValueContainer>
          )}
        </S.Wrapper>
      </S.HeaderWrapper>
      <S.ContentWrapper $isVisible={isVisible}>
        <S.Wrapper>
          <S.ProfileName>{streamShortInfo.profile}</S.ProfileName>
          <S.SensorName>{streamShortInfo.sensorName}</S.SensorName>
        </S.Wrapper>
        <S.Wrapper>
          {noData ? (
            <S.NoData>{t("sessionDetailsModal.noData")}</S.NoData>
          ) : (
            <>
              <S.MinMaxValueContainer $isMobile={isMobile}>
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
            </>
          )}
          <S.TimeRange>
            {formattedTime(streamShortInfo.startTime ?? "")} -{" "}
            {formattedTime(streamShortInfo.endTime ?? "")}
          </S.TimeRange>
        </S.Wrapper>
      </S.ContentWrapper>
    </S.ModalMobileHeader>
  );
};

export default ModalMobileHeader;

import React from "react";
import { useTranslation } from "react-i18next";

import calendar from "../../../../assets/icons/calendar.svg";
import copyLink from "../../../../assets/icons/copyLinkIcon.svg";
import downloadImage from "../../../../assets/icons/download.svg";
import { MobileStreamShortInfo as StreamShortInfo } from "../../../../types/mobileStream";
import { Thresholds } from "../../../../types/thresholds";
import { UserSettings } from "../../../../types/userStates";
import {
  UrlParamsTypes,
  useMapParams,
} from "../../../../utils/mapParamsHandler";
import { isNoData } from "../../../../utils/measurementsCalc";
import { screenSizes } from "../../../../utils/media";
import { getColorForValue } from "../../../../utils/thresholdColors";
import useScreenSizeDetection from "../../../../utils/useScreenSizeDetection";
import { CopyLinkComponent } from "../../../Popups/CopyLinkComponent";
import { ExportDataComponent } from "../../../Popups/ExportDataComponent";
import * as S from "../SessionDetailsModal.style";

interface Extremes {
  minMeasurementValue: number | null;
  maxMeasurementValue: number | null;
  averageValue: number | null;
}

interface ModalDesktopHeaderProps {
  streamShortInfo: StreamShortInfo;
  thresholds: Thresholds;
  extremes: Extremes;
  streamId: number | null;
  fixedSessionTypeSelected: boolean;
}

const ModalDesktopHeader: React.FC<ModalDesktopHeaderProps> = ({
  streamShortInfo,
  thresholds,
  extremes,
  streamId,
  fixedSessionTypeSelected,
}) => {
  const { currentUserSettings, searchParams } = useMapParams();
  const { t } = useTranslation();
  const isMobile = useScreenSizeDetection(screenSizes.largeDesktop);
  const newSearchParams = new URLSearchParams(searchParams.toString());

  const { minMeasurementValue, maxMeasurementValue, averageValue } = extremes;
  const noData = isNoData(
    extremes.minMeasurementValue,
    extremes.maxMeasurementValue,
    extremes.averageValue
  );

  newSearchParams.set(UrlParamsTypes.previousUserSettings, currentUserSettings);
  newSearchParams.set(
    UrlParamsTypes.currentUserSettings,
    UserSettings.CalendarView
  );

  const calendarButton = fixedSessionTypeSelected ? (
    <S.BlueButton
      to={`/fixed_stream?streamId=${streamId}&${newSearchParams.toString()}`}
    >
      {isMobile ? "" : t("sessionDetailsModal.calendar")}
      <img src={calendar} alt={t("sessionDetailsModal.calendarIcon")} />
    </S.BlueButton>
  ) : null;

  return (
    <S.ModalDesktopHeader>
      <S.Wrapper>
        <S.SessionName>{streamShortInfo.title}</S.SessionName>
        <S.ProfileName>{streamShortInfo.profile}</S.ProfileName>
        <S.SensorName>{streamShortInfo.sensorName}</S.SensorName>
      </S.Wrapper>
      <S.Wrapper>
        {noData ? (
          <S.NoData>{t("sessionDetailsModal.noData")}</S.NoData>
        ) : (
          <>
            <S.AverageValueContainer>
              <S.AverageDot
                $color={getColorForValue(thresholds, averageValue)}
              />
              {t("sessionDetailsModal.averageValue")}
              <S.AverageValue>{averageValue}</S.AverageValue>
              {streamShortInfo.unitSymbol}
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
          </>
        )}
        <S.TimeRange>
          {streamShortInfo.startTime} - {streamShortInfo.endTime}
        </S.TimeRange>
      </S.Wrapper>
      <S.ButtonsContainer>
        {calendarButton}
        <ExportDataComponent
          button={
            <S.Button aria-labelledby={t("calendarHeader.altExportSession")}>
              <img
                src={downloadImage}
                alt={t("calendarHeader.altExportSession")}
              />
            </S.Button>
          }
          fixedSessionTypeSelected={fixedSessionTypeSelected}
          sessionsIds={[streamShortInfo.sessionId]}
          isIconOnly={true}
          onSubmit={(formData) => {}}
          isSessionList={false}
        />
        <CopyLinkComponent
          button={
            <S.Button aria-label={t("copyLinkModal.altCopyLink")}>
              <img src={copyLink} alt={t("copyLinkModal.copyLink")} />
            </S.Button>
          }
          isIconOnly
        />
      </S.ButtonsContainer>
    </S.ModalDesktopHeader>
  );
};

export default ModalDesktopHeader;

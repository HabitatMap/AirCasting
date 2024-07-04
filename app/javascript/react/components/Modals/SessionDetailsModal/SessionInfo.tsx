import moment from "moment";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { ExportDataModal } from "../";
import calendar from "../../../assets/icons/calendar.svg";
import downloadImage from "../../../assets/icons/download.svg";
import shareLink from "../../../assets/icons/shareLink.svg";
import toggleIcon from "../../../assets/icons/toggleIcon.svg";
import { white } from "../../../assets/styles/colors";
import {
  selectFixedExtremes,
  selectFixedStreamShortInfo,
} from "../../../store/fixedStreamSelectors";
import {
  selectMobileExtremes,
  selectMobileStreamShortInfo,
} from "../../../store/mobileStreamSelectors";
import { selectThresholds } from "../../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../../types/filters";
import { MobileStreamShortInfo as StreamShortInfo } from "../../../types/mobileStream";
import { copyCurrentURL } from "../../../utils/copyCurrentUrl";
import { isNoData } from "../../../utils/measurementsCalc";
import { getColorForValue } from "../../../utils/thresholdColors";
import useMobileDetection from "../../../utils/useScreenSizeDetection";
import { CopyLinkModal } from "../CopyLinkModal";
import * as S from "./SessionDetailsModal.style";

interface SessionInfoProps {
  sessionType: SessionType;
  streamId: number | null;
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
}

const SessionInfo: React.FC<SessionInfoProps> = ({
  sessionType,
  streamId,
  isVisible,
  setIsVisible,
}) => {
  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;
  const isMobile = useMobileDetection();

  const streamShortInfo: StreamShortInfo = useSelector(
    fixedSessionTypeSelected
      ? selectFixedStreamShortInfo
      : selectMobileStreamShortInfo
  );
  const extremes = useSelector(
    fixedSessionTypeSelected ? selectFixedExtremes : selectMobileExtremes
  );
  const thresholds = useSelector(selectThresholds);
  const { t } = useTranslation();

  const formattedTime = (time: string) => {
    return moment.utc(time).format("MM/DD/YYYY HH:mm");
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const { minMeasurementValue, maxMeasurementValue, averageValue } = extremes;

  const noData = isNoData(
    minMeasurementValue,
    maxMeasurementValue,
    averageValue
  );

  return (
    <S.InfoContainer>
      <S.MobileHeader>
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
      </S.MobileHeader>
      <S.DesktopHeader>
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
            {formattedTime(streamShortInfo.startTime ?? "")} -{" "}
            {formattedTime(streamShortInfo.endTime ?? "")}
          </S.TimeRange>
        </S.Wrapper>
        <S.ButtonsContainer>
          {fixedSessionTypeSelected && (
            <S.BlueButton to={`/fixed_stream?streamId=${streamId}`}>
              {t("sessionDetailsModal.calendar")}
              <img src={calendar} alt={t("sessionDetailsModal.calendarIcon")} />
            </S.BlueButton>
          )}
          <S.SmallPopup
            trigger={
              <S.Button aria-labelledby={t("calendarHeader.altExportSession")}>
                <img
                  src={downloadImage}
                  alt={t("calendarHeader.altExportSession")}
                />
              </S.Button>
            }
            position="top center"
            nested
            closeOnDocumentClick
            offsetX={fixedSessionTypeSelected ? 0 : 40}
            arrowStyle={
              fixedSessionTypeSelected
                ? {}
                : {
                    left: "34%",
                    borderColor: `transparent transparent ${white} transparent`,
                    borderWidth: "0 10px 10px 10px",
                    borderStyle: "solid",
                  }
            }
          >
            <ExportDataModal
              sessionId={streamShortInfo.sessionId}
              onSubmit={(formData) => {}}
            />
          </S.SmallPopup>
          <S.SmallPopup
            trigger={
              <S.Button
                onClick={copyCurrentURL}
                aria-label={t("copyLinkModal.altCopyLink")}
              >
                <img src={shareLink} alt={t("copyLinkModal.copyLink")} />
              </S.Button>
            }
            position="top center"
            nested
            closeOnDocumentClick
          >
            <CopyLinkModal
              sessionId={streamShortInfo.sessionId}
              onSubmit={(formData) => {}}
            />
          </S.SmallPopup>
        </S.ButtonsContainer>
      </S.DesktopHeader>
    </S.InfoContainer>
  );
};

export default SessionInfo;

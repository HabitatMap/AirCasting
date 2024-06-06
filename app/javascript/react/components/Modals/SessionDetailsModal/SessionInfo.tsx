import moment from "moment";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { ExportDataModal } from "../";
import calendar from "../../../assets/icons/calendar.svg";
import downloadImage from "../../../assets/icons/download.svg";
import shareLink from "../../../assets/icons/shareLink.svg";
import { selectFixedStreamShortInfo } from "../../../store/fixedStreamSelectors";
import { selectThreshold } from "../../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../../types/filters";
import { copyCurrentURL } from "../../../utils/copyCurrentUrl";
import { getColorForValue } from "../../../utils/thresholdColors";
import { CopyLinkModal } from "../CopyLinkModal";
import * as S from "./SessionDetailsModal.style";

interface SessionInfoProps {
  sessionType: SessionType;
  streamId: number | null;
}

const SessionInfo: React.FC<SessionInfoProps> = ({ sessionType, streamId }) => {
  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;

  const streamShortInfo = useSelector(
    fixedSessionTypeSelected ? selectFixedStreamShortInfo : ""
  );

  const thresholds = useSelector(selectThreshold);
  const { t } = useTranslation();

  const formattedTime = (time: string) => {
    return moment(time).format("MM/DD/YYYY HH:mm");
  };

  return (
    <S.InfoContainer>
      <S.Wrapper>
        <S.SessionName>{streamShortInfo.title}</S.SessionName>
        <S.ProfileName>{streamShortInfo.profile}</S.ProfileName>
        <S.SensorName>{streamShortInfo.sensorName}</S.SensorName>
      </S.Wrapper>
      <S.Wrapper>
        <S.AverageValueContainer>
          <S.AverageDot
            $color={getColorForValue(
              thresholds,
              streamShortInfo.lastMeasurementValue || null
            )}
          />
          {t("sessionDetailsModal.averageValue")}
          <S.AverageValue>
            {streamShortInfo.lastMeasurementValue}
          </S.AverageValue>
          {streamShortInfo.unitSymbol}
        </S.AverageValueContainer>
        <S.MinMaxValueContainer>
          <div>
            <S.SmallDot
              $color={getColorForValue(thresholds, streamShortInfo.min)}
            />
            {t("sessionDetailsModal.minValue")}
            <S.Value>{streamShortInfo.min}</S.Value>
          </div>
          <div>
            <S.SmallDot
              $color={getColorForValue(thresholds, streamShortInfo.max)}
            />
            {t("sessionDetailsModal.maxValue")}
            <S.Value>{streamShortInfo.max}</S.Value>
          </div>
        </S.MinMaxValueContainer>
        <S.TimeRange>
          {formattedTime(streamShortInfo.startTime ?? "")} -{" "}
          {formattedTime(streamShortInfo.endTime ?? "")}
        </S.TimeRange>
      </S.Wrapper>
      <S.ButtonsContainer>
        <S.BlueButton to={`/fixed_stream?streamId=${streamId}`}>
          {t("sessionDetailsModal.calendar")}
          <img src={calendar} alt={t("sessionDetailsModal.calendarIcon")} />
        </S.BlueButton>
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
    </S.InfoContainer>
  );
};

export default SessionInfo;

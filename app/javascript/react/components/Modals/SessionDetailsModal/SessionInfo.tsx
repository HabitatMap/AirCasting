// SessionInfo.tsx
import React from "react";
import * as S from "./SessionDetailsModal.style";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import moment from "moment";

import { selectFixedStreamShortInfo } from "../../../store/fixedStreamSelectors";
import { selectThreshold } from "../../../store/thresholdSlice";

import chartIcon from "../../../assets/icons/chartIcon.svg";
import downloadImage from "../../../assets/icons/download.svg";
import shareLink from "../../../assets/icons/shareLink.svg";
import { copyCurrentURL } from "../../../utils/copyCurrentUrl";
import { getColorForValue } from "../../../utils/thresholdColors";

import { ExportDataModal } from "..";
import { CopyLinkModal } from "../CopyLinkModal";

interface SessionInfoProps {
  streamId: number | null;
}

const SessionInfo: React.FC<SessionInfoProps> = ({ streamId }) => {
  const {
    unitSymbol,
    title,
    sensorName,
    lastMeasurementValue,
    lastMeasurementDateLabel,
    active,
    sessionId,
    startTime,
    endTime,
    min,
    max,
  } = useSelector(selectFixedStreamShortInfo);
  const thresholds = useSelector(selectThreshold);
  const { t } = useTranslation();

  const formattedTime = (time: string) => {
    return moment(time).format("DD/MM/YYYY HH:mm");
  };

  return (
    <S.InfoContainer>
      <S.Wrapper>
        <S.SessionName>{title}</S.SessionName>
        <S.SensorName>{sensorName}</S.SensorName>
      </S.Wrapper>
      <S.Wrapper>
        <S.AverageValueContainer>
          <S.AverageDot
            $color={getColorForValue(thresholds, lastMeasurementValue || null)}
          />
          {t("sessionDetailsModal.averageValue")}
          <S.AverageValue>{lastMeasurementValue}</S.AverageValue>
          {unitSymbol}
        </S.AverageValueContainer>
        <S.MinMaxValueContainer>
          <div>
            <S.SmallDot $color={getColorForValue(thresholds, min)} />
            {t("sessionDetailsModal.minValue")}
            <S.Value>{min}</S.Value>
          </div>
          <div>
            <S.SmallDot $color={getColorForValue(thresholds, max)} />
            {t("sessionDetailsModal.maxValue")}
            <S.Value>{max}</S.Value>
          </div>
        </S.MinMaxValueContainer>
        <S.TimeRange>
          {formattedTime(startTime ?? "")} - {formattedTime(endTime ?? "")}
        </S.TimeRange>
      </S.Wrapper>
      <S.ButtonsContainer>
        <S.BlueButton to={`/fixed_stream?streamId=${streamId}`}>
          {t("sessionDetailsModal.calendar")}
          <img src={chartIcon} alt={t("sessionDetailsModal.chartIcon")} />
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
          <ExportDataModal sessionId={sessionId} onSubmit={(formData) => {}} />
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
          <CopyLinkModal sessionId={sessionId} onSubmit={(formData) => {}} />
        </S.SmallPopup>
      </S.ButtonsContainer>
    </S.InfoContainer>
  );
};

export default SessionInfo;

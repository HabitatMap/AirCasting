// SessionInfo.tsx
import React from "react";
import * as S from "./SessionDetailsModal.style";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import chartIcon from "../../assets/icons/chartIcon.svg";
import downloadImage from "../../assets/icons/download.svg";
import shareLink from "../../assets/icons/shareLink.svg";
import { copyCurrentURL } from "../../utils/copyCurrentUrl";
import { useAppDispatch } from "../../store/hooks";
import moment from "moment";
import { getColorForValue } from "../../utils/thresholdColors";
import { selectThreshold } from "../../store/thresholdSlice";

interface SessionInfoProps {
  streamId: number;
  handleOpenDesktopExportModal: (
    event: React.MouseEvent<HTMLButtonElement>
  ) => void;
}

const SessionInfo: React.FC<SessionInfoProps> = ({
  streamId,
  handleOpenDesktopExportModal,
}) => {
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
      <S.SessionName>{title}</S.SessionName>
      <S.SensorName>{sensorName}</S.SensorName>
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
        {formattedTime(startTime)} - {formattedTime(endTime)}
      </S.TimeRange>
      <S.ButtonsContainer>
        <S.BlueButton to={`/fixed_stream?streamId=${streamId}`}>
          {t("sessionDetailsModal.calendar")}
          <img src={chartIcon} alt={t("sessionDetailsModal.chartIcon")} />
        </S.BlueButton>
        <S.Button
          onClick={handleOpenDesktopExportModal}
          aria-labelledby={t("calendarHeader.altExportSession")}
        >
          <img src={downloadImage} />
        </S.Button>
        <S.Button
          onClick={copyCurrentURL}
          aria-label={t("calendarHeader.altShareLink")}
        >
          <img src={shareLink} alt={t("sessionDetailsModal.copyLink")} />
        </S.Button>
      </S.ButtonsContainer>
    </S.InfoContainer>
  );
};

export default SessionInfo;

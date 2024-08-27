import React from "react";
import { useTranslation } from "react-i18next";
import { TimeRanges } from "../../../types/timelapse";
import * as S from "./TimelapseComponent.style";

interface TimeRangeButtonsProps {
  timeRange: TimeRanges;
  onSelectTimeRange: (range: TimeRanges) => void;
}

const TimeRangeButtons: React.FC<TimeRangeButtonsProps> = ({
  timeRange,
  onSelectTimeRange,
}) => {
  const { t } = useTranslation();

  return (
    <S.TimeRangeButtonsContainer>
      <S.TimeRangeLabel>{t("timelapse.timeRange.label")}</S.TimeRangeLabel>
      <S.TimeRangeButton
        $isActive={timeRange === TimeRanges.HOURS_24}
        onClick={() => onSelectTimeRange(TimeRanges.HOURS_24)}
      >
        {t("timelapse.timeRange.24hours")}
      </S.TimeRangeButton>
      <S.TimeRangeButton
        $isActive={timeRange === TimeRanges.DAYS_3}
        onClick={() => onSelectTimeRange(TimeRanges.DAYS_3)}
      >
        {t("timelapse.timeRange.3days")}
      </S.TimeRangeButton>
      <S.TimeRangeButton
        $isActive={timeRange === TimeRanges.DAYS_7}
        onClick={() => onSelectTimeRange(TimeRanges.DAYS_7)}
      >
        {t("timelapse.timeRange.7days")}
      </S.TimeRangeButton>
    </S.TimeRangeButtonsContainer>
  );
};

export default TimeRangeButtons;

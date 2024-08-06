import React from "react";
import { useTranslation } from "react-i18next";

import { StreamUpdate } from "../../../../../types/fixedStream";
import { formatTime } from "../../../../../utils/measurementsCalc";
import {
  HorizontalContainer,
  RowContainer,
  Subtitle,
} from "../../FixedStreamStationHeader.style";
import * as S from "./StreamUpdate.style";

const StreamUpdate: React.FC<StreamUpdate> = ({
  lastUpdate,
  updateFrequency,
  startTime,
  endTime,
}) => {
  const { t } = useTranslation();

  const formattedTime = formatTime(startTime, endTime);

  return (
    <HorizontalContainer>
      <RowContainer>
        <Subtitle>{t("calendarHeader.dateRange")}</Subtitle>

        <S.RangeLabel>
          {formattedTime.formattedMinTime?.date}
          <span className="hyphen-padding">-</span>
          {formattedTime.formattedMaxTime?.date}
        </S.RangeLabel>
      </RowContainer>
      <RowContainer>
        <Subtitle>{t("calendarHeader.updateFrequencyTitle")}</Subtitle>
        <S.FrequencyLabel>{updateFrequency}</S.FrequencyLabel>
      </RowContainer>
      <RowContainer>
        <Subtitle>{t("calendarHeader.lastUpdate")}</Subtitle>
        <S.DateLabel>
          {t("calendarHeader.localTime", { lastUpdate: lastUpdate })}
        </S.DateLabel>
      </RowContainer>
    </HorizontalContainer>
  );
};

export { StreamUpdate };

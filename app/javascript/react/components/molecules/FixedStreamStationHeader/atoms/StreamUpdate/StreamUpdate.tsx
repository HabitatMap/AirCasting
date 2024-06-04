import React from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";

import { StreamUpdate } from "../../../../../types/fixedStream";
import {
  HorizontalContainer,
  RowContainer,
  Subtitle,
} from "../../FixedStreamStationHeader.style";
import * as S from "./StreamUpdate.style";
import { DateFormat } from "../../../../../types/dateFormat";

const StreamUpdate: React.FC<StreamUpdate> = ({
  lastUpdate,
  updateFrequency,
  startTime,
  endTime,
}) => {
  const { t } = useTranslation();

  const formatStartTime = () => {
    const formatted = moment(startTime, DateFormat.default);
    if (formatted.isValid()) {
      return formatted.format(DateFormat.us);
    }
    return "";
  };

  const formatEndTime = () => {
    const formatted = moment(endTime, DateFormat.default);
    if (formatted.isValid()) {
      return formatted.format(DateFormat.us);
    }
    return "";
  };

  const isDateRangeValid = formatStartTime() && formatEndTime();

  return (
    <HorizontalContainer>
      <RowContainer>
        <Subtitle>{t("calendarHeader.dateRange")}</Subtitle>
        {isDateRangeValid && (
          <S.RangeLabel>
            {formatStartTime()}
            <span className="hyphen-padding">-</span>
            {formatEndTime()}
          </S.RangeLabel>
        )}
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

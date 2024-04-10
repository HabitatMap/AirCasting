import React from "react";
import { useTranslation } from "react-i18next";

import { StreamUpdate } from "../../../../../types/fixedStream";
import {
  HorizontalContainer,
  RowContainer,
  Subtitle,
} from "../../FixedStreamStationHeader.style";
import * as S from "./StreamUpdate.style";

const StreamUpdate: React.FC<StreamUpdate> = ({
  lastUpdate,
  updateFrequency,
}) => {
  const { t } = useTranslation();

  return (
    <HorizontalContainer>
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

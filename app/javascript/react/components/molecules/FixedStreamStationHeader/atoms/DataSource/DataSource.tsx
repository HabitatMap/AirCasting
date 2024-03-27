import React from "react";
import { useTranslation } from "react-i18next";

import { DataSource } from "../../../../../types/fixedStream";
import {
  HorizontalContainer,
  RowContainer,
  Subtitle,
} from "../../FixedStreamStationHeader.style";
import * as S from "./DataSource.style";

const DataSource: React.FC<DataSource> = ({ profile, sensorName }) => {
  const { t } = useTranslation();

  return (
    <HorizontalContainer>
      <RowContainer>
        <Subtitle>{t("calendarHeader.profile")}</Subtitle>
        <S.DataDescription>{profile}</S.DataDescription>
      </RowContainer>
      <RowContainer>
        <Subtitle>{t("calendarHeader.sensor")}</Subtitle>
        <S.DataDescription>{sensorName}</S.DataDescription>
      </RowContainer>
    </HorizontalContainer>
  );
};

export { DataSource };

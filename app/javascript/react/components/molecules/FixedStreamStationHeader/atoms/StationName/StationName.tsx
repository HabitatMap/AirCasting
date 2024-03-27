import React from "react";
import { useTranslation } from "react-i18next";

import { HorizontalContainer } from "../../FixedStreamStationHeader.style";
import * as S from "./StationName.style";

const StationName: React.FC<{ stationName: string }> = ({ stationName }) => {
  const { t } = useTranslation();

  return (
    <HorizontalContainer>
      <S.Label>{t("calendarHeader.stationLabel")}</S.Label>
      <S.Heading>{stationName}</S.Heading>
    </HorizontalContainer>
  );
};

export { StationName };

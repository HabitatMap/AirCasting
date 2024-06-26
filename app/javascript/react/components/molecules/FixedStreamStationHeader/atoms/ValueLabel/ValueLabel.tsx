import { useTranslation } from "react-i18next";
import React from "react";

import BroadCastLogo from "../../../../../assets/icons/broadCastLogo.svg";
import * as S from "./ValueLabel.style";

interface StationValues {
  unitSymbol: string;
  date?: string;
  value?: number;
  isActive?: boolean;
}

const ValueLabel = ({ date, value, unitSymbol, isActive }: StationValues) => {
  const { t } = useTranslation();

  return (
    <S.Container $isActive={isActive}>
      <S.ImageContainer
        src={BroadCastLogo}
        alt={t("stationValue.altLogo")}
      ></S.ImageContainer>
      <S.TextContainer>
        <S.Label>{t("stationValue.avgPlaceholder", { date: date })}</S.Label>
        <S.Header>{value}</S.Header>
        <S.Label>{unitSymbol}</S.Label>
      </S.TextContainer>
    </S.Container>
  );
};

export { ValueLabel };

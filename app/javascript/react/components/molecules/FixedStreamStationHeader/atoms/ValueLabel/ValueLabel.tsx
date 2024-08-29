import { useTranslation } from "react-i18next";
import React from "react";

import BroadCastLogo from "../../../../../assets/icons/broadCastLogo.svg";
import { getColorForCalendarDataCard, getColorForValue } from "../../../../../utils/thresholdColors";
import * as S from "./ValueLabel.style";
import { useAppSelector } from "../../../../../store/hooks";
import { selectThresholds } from "../../../../../store/thresholdSlice";

interface StationValues {
  unitSymbol: string;
  date?: string;
  value?: number;
  isActive?: boolean;
}

const ValueLabel = ({ date, value, unitSymbol, isActive }: StationValues) => {
  const { t } = useTranslation();

  const thresholds = useAppSelector(selectThresholds);

  const averageValueColor = getColorForValue(thresholds, value ?? -1000);
  const dataCardColor = getColorForCalendarDataCard(averageValueColor);

  return (
    <S.Container $isActive={isActive} $color={dataCardColor}>
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

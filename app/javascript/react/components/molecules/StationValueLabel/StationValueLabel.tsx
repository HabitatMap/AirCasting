import { useTranslation } from "react-i18next";
import React from "react";

import BroadCastLogo from "../../../assets/icons/broadCastLogo.svg";
import * as S from "./StationValueLabel.style";

interface StationValues {
  date: string;
  value: number;
  parameter: string;
}

const StationValueLabel = ({ date, value, parameter }: StationValues) => {
  const { t, i18n } = useTranslation();

  return (
    <S.Container>
      <S.ImageContainer
        src={BroadCastLogo}
        alt={t("stationValue.altLogo")}
      ></S.ImageContainer>
      <S.TextContainer>
        <S.Label>
          {i18n.t("stationValue.avgPlaceholder", { date: date })}
        </S.Label>
        <S.Header>{value}</S.Header>
        <S.Label>{parameter}</S.Label>
      </S.TextContainer>
    </S.Container>
  );
};

export { StationValueLabel };

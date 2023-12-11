import React from "react";
import BroadCastLogo from "../../../assets/icons/broadCastLogo.svg";
import * as S from "./StationValueLabel.style";
import { useTranslation } from 'react-i18next';

interface StationValues {
  date: string;
  value: number;
  parameter: string;
}

const StationValueLabel = ({ date, value, parameter }: StationValues) => {
  const { t, i18n } = useTranslation();
  i18n.changeLanguage('en-US');
  return (
    <S.Container>
      <S.ImageContainer
        src={BroadCastLogo}
        alt="Broadcasting logo"
      ></S.ImageContainer>
      <S.TextContainer>
        <S.Label>
        {t('Welcome to React": "Welcome to React and react-i18next"')}
        </S.Label>
        <S.Label>Avg for {date}</S.Label>
        <S.Header>{value}</S.Header>
        <S.Label>{parameter}</S.Label>
      </S.TextContainer>
    </S.Container>
  );
};

export { StationValueLabel };

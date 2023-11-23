import React from "react";
import BroadCastLogo from "../../../assets/icons/broadCastLogo.svg";
import * as S from "./StationValueLabel.style";

interface StationValues {
  date: string;
  value: number;
  parameter: string;
}

const StationValueLabel = ({ date, value, parameter }: StationValues) => {
  return (
    <S.Container>
      <S.ImageContainer
        src={BroadCastLogo}
        alt="Broadcasting logo"
      ></S.ImageContainer>
      <S.TextContainer>
        <S.Label>Avg for {date}</S.Label>
        <S.Header>{value}</S.Header>
        <S.Label>{parameter}</S.Label>
      </S.TextContainer>
    </S.Container>
  );
};

export { StationValueLabel };

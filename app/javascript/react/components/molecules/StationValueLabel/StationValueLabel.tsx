import React from "react";
import BroadCastLogo from "../../../assets/icons/broadCastLogo.svg";
import { LargeH1, H3 } from "../../../assets/styles/Typography";
import * as S from "./StationValueLabel.style";

interface StationValues {
  date: string;
  value: number;
  parameter: string;
}

const StationValueLabel = ({ date, value, parameter }: StationValues) => {
  return (
    <S.GradientBox>
      <S.GradientImage>
        <img src={BroadCastLogo} alt="Broadcasting logo" />
      </S.GradientImage>
      <S.TextContainer>
        <H3>Avg for {date}</H3>
        <LargeH1>{value}</LargeH1>
        <H3>{parameter}</H3>
      </S.TextContainer>
    </S.GradientBox>
  );
};

export { StationValueLabel };

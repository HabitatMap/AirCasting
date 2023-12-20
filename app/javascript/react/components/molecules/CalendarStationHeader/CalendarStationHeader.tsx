import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../Navbar/Navbar.style";
import { H3, H4, H5 } from "../../Typography";
import { StationValueLabel } from "../StationValueLabel";
import * as S from "./CalendarStationHeader.style";

interface CalendarStation {
  stationName: string;
  profile: string;
  sensor: string;
  lastUpdate: string;
}

const CalendarStationHeader = () => {
  const { t, i18n } = useTranslation();

  return (
    <>
    <StationValueLabel date={"ddd"} value={2} parameter={"DF"}/>
      <S.TextContainer>
        <H5>Air Quality for Station:</H5>
        <H3 bold={true}>White Plains, New York Nothern New Jersay- London</H3>
        <H4>
          Profile: <S.BoldText>TIM CAINS</S.BoldText>
        </H4>
        <H4>
          Sensor: <S.BoldText>OPENAQ-2.5</S.BoldText>
        </H4>
        <H5>Updates every 15 minutes</H5>
        <H5>
          Last update: <S.BoldText>18:00</S.BoldText>
        </H5>
      </S.TextContainer>
    </>
  );
};

export { CalendarStationHeader };

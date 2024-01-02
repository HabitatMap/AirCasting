import React from "react";
import { useTranslation } from "react-i18next";
import { ActionButton } from "../../ActionButton/ActionButton.style";
import { Button } from "../../Navbar/Navbar.style";
import { H5 } from "../../Typography";
import { StationValueLabel } from "../StationValueLabel";
import * as S from "./CalendarStationHeader.style";
import bellAlert from "../../../assets/icons/bellAlert.svg";
import shareLink from "../../../assets/icons/shareLink.svg";

interface CalendarStation {
  stationName: string;
  profile: string;
  sensor: string;
  lastUpdate: string;
}

const CalendarStationHeader = () => {
  const { t, i18n } = useTranslation();

  return (
    <S.Container>
      <S.ImageContainer>
      <StationValueLabel date={"Jun 12"} value={12} parameter={"M2.5 µg/m "}/>
      </S.ImageContainer>
      <S.TextContainer>
        <S.Description>{t("calendarHeader.stationPrefix")}:</S.Description>
        <S.Header>White Plains, New York Nothern New Jersay- London</S.Header>
        <S.DataDescriptionText>
        {t("calendarHeader.profile")}: <S.DataDescriptionValue>Tim Cains</S.DataDescriptionValue>
        </S.DataDescriptionText>
        <S.DataDescriptionText>
        {t("calendarHeader.sensor")}: <S.DataDescriptionValue>Government Data USEPA</S.DataDescriptionValue>
        </S.DataDescriptionText>
        <H5>Updates every 15 minutes</H5>
        <H5>
        {t("calendarHeader.lastUpdate")}: <H5 bold={true}>18:00, Sep 1 (local time)</H5>
        </H5>
        <ActionButton>
          <img src={bellAlert}/>
        </ActionButton>
        <ActionButton>
          <img src={shareLink}/>
        </ActionButton>
      </S.TextContainer>
    </S.Container>
  );
};

export { CalendarStationHeader };

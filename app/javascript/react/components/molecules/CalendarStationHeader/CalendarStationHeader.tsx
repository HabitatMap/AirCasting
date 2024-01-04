import React from "react";
import { useTranslation } from "react-i18next";
import { ActionButton } from "../../ActionButton/ActionButton.style";
import { Button } from "../../Button/Button";
import { H5 } from "../../Typography";
import { StationValueLabel } from "../StationValueLabel";
import * as S from "./CalendarStationHeader.style";
import bellAlert from "../../../assets/icons/bellAlert.svg";
import shareLink from "../../../assets/icons/shareLink.svg";
import downloadImage from "../../../assets/icons/download.svg";
import copyLink from "../../../assets/icons/copyLink.svg";
import media from "../../../utils/media";
import MediaQuery from "react-responsive";

interface CalendarStation {
  stationName: string;
  profile: string;
  sensor: string;
  lastUpdate: string;
}

const CalendarStationHeader = () => {
  const { t } = useTranslation();

  const stationNameAndHeader = () => {
    return (
      <>
        <S.Description>{t("calendarHeader.stationPrefix")}:</S.Description>
        <S.Header>White Plains, New York Nothern New Jersay- London</S.Header>
      </>
    );
  };

  const profileAndSensor = () => {
    return (
      <>
       <S.HorizontalContainer>
       <S.DataDescriptionText>
          {t("calendarHeader.profile")}
          </S.DataDescriptionText>
          <S.DataDescriptionValue>Tim Cains</S.DataDescriptionValue>
       </S.HorizontalContainer>

          <S.HorizontalContainer>
          <S.DataDescriptionText>
          {t("calendarHeader.sensor")}
          </S.DataDescriptionText>
          <S.DataDescriptionValue>Government Data USEPA</S.DataDescriptionValue>
          </S.HorizontalContainer>
      </>
    );
  };

  const updateOccurance = () => {
    return (
      <>
      <S.HorizontalContainer>
      <S.UpdateLabel>Updates every</S.UpdateLabel>
        <H5>15 minutes</H5>
      </S.HorizontalContainer>

      <S.HorizontalContainer>
      <S.UpdateLabel>{t("calendarHeader.lastUpdate")}</S.UpdateLabel>
        <H5>18:00, Sep 1 (local time)</H5>
      </S.HorizontalContainer>
      </>
    );
  };

  const actionableButtons = () => {
    return (
      <>
        <MediaQuery query={media.mobile}>
          <S.HorizontalContainer>
            <ActionButton>
              <img src={bellAlert} />
            </ActionButton>
            <ActionButton>
              <img src={shareLink} />
            </ActionButton>
          </S.HorizontalContainer>
        </MediaQuery>

        <MediaQuery query={media.desktop}>
          <S.HorizontalContainer>
            <Button onClick={() => {}}>COPY LINK <img src={copyLink}/></Button>
            <Button onClick={() => {}}>EXPORT SESSION <img src={downloadImage}/></Button>
          </S.HorizontalContainer>
        </MediaQuery>
      </>
    );
  };

  return (
    <S.Container>
      <S.ImageContainer>
        <StationValueLabel
          date={"Jun 12"}
          value={12}
          parameter={"M2.5 µg/m "}
        />
      </S.ImageContainer>

      <MediaQuery query={media.mobile}>
      <S.TextContainer>
        {stationNameAndHeader()}
        {profileAndSensor()}
        {updateOccurance()}
        {actionableButtons()}
      </S.TextContainer>
      </MediaQuery>

      <MediaQuery query={media.desktop}>
      <S.TextContainer>
        {stationNameAndHeader()}
        {updateOccurance()}
      </S.TextContainer>
      <S.TextContainer>
      {profileAndSensor()}
        {actionableButtons()}
      </S.TextContainer>
      </MediaQuery>
    
    </S.Container>
  );
};

export { CalendarStationHeader };

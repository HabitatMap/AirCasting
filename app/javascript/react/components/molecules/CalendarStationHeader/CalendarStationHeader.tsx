import React from "react";

import { useTranslation } from "react-i18next";
import { ActionButton } from "../../ActionButton/ActionButton.style";
import { Button } from "../../Button/Button";
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
  stationValues: StationValues
}

interface StationValues {
  day: string;
  value: number;
  parameter: string;
}

const CalendarStationHeader = ({ stationName, profile, sensor, lastUpdate, stationValues}: CalendarStation) => {
  const { t } = useTranslation();

  const stationNameAndHeader = () => {
    return (
      <>
        <S.Description>{t("calendarHeader.stationPrefix")}:</S.Description>
        <S.Header>{stationName}</S.Header>
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
          <S.DataDescriptionValue>{profile}</S.DataDescriptionValue>
        </S.HorizontalContainer>

        <S.HorizontalContainer>
          <S.DataDescriptionText>
            {t("calendarHeader.sensor")}
          </S.DataDescriptionText>
          <S.DataDescriptionValue>{sensor}</S.DataDescriptionValue>
        </S.HorizontalContainer>
      </>
    );
  };

  const updateOccurance = () => {
    return (
      <>
        <S.HorizontalContainer>
          <S.UpdateLabel>Updates every 15 minutes</S.UpdateLabel>
        </S.HorizontalContainer>

        <S.HorizontalContainer>
          <S.UpdateLabel>{t("calendarHeader.lastUpdate")}</S.UpdateLabel>
          <S.UpdateDateLabel>{lastUpdate} (local time)</S.UpdateDateLabel>
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
            <Button onClick={() => {}}>
              COPY LINK <img src={copyLink} />
            </Button>
            <Button onClick={() => {}}>
              EXPORT SESSION <img src={downloadImage} />
            </Button>
          </S.HorizontalContainer>
        </MediaQuery>
      </>
    );
  };

  return (
    <S.Container>
      <S.ImageContainer>
        <StationValueLabel
          date={stationValues.day}
          value={stationValues.value}
          parameter={stationValues.parameter}
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
        <S.HorizontalSpacingContainer>
        <S.TextContainer>
          {stationNameAndHeader()}
          {updateOccurance()}
        </S.TextContainer>

        <S.TextContainer>
          {profileAndSensor()}
          {actionableButtons()}
        </S.TextContainer>
        </S.HorizontalSpacingContainer>
      </MediaQuery>
    </S.Container>
  );
};

export { CalendarStationHeader };

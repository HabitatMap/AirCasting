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

interface CalendarStation {
  stationName: string;
  profile: string;
  sensor: string;
  lastUpdate: string;
  streamData: StreamData;
}

interface StreamData {
  day: string;
  value: number;
  parameter: string;
}

const CalendarHeaderName: React.FC<{ stationName: string }> = ({
  stationName,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <S.HorizontalContainer>
        <S.Description>{t("calendarHeader.stationPrefix")}</S.Description>
        <S.Header>{stationName}</S.Header>
      </S.HorizontalContainer>
    </>
  );
};

const CalendarStationProfileSensor: React.FC<{
  profile: string;
  sensor: string;
}> = ({ profile, sensor }) => {
  const { t } = useTranslation();

  return (
    <>
      <S.HorizontalContainer>
        <S.MixContainer>
          <S.DataDescriptionText>
            {t("calendarHeader.profile")}
          </S.DataDescriptionText>
          <S.DataDescriptionValue>{profile}</S.DataDescriptionValue>
        </S.MixContainer>

        <S.MixContainer>
          <S.DataDescriptionText>
            {t("calendarHeader.sensor")}
          </S.DataDescriptionText>
          <S.DataDescriptionValue>{sensor}</S.DataDescriptionValue>
        </S.MixContainer>
      </S.HorizontalContainer>
    </>
  );
};

const CalendarUpdateOccurance: React.FC<{ lastUpdate: string }> = ({
  lastUpdate,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <S.HorizontalContainer>
      <S.MixContainer>
        <S.UpdateLabel>
          {t("calendarHeader.updateFrequencyTitle")}
        </S.UpdateLabel>
        <S.UpdateFrequencyLabel>
          {i18n.t("calendarHeader.updateFrequencyValue", { value: 15 })}
        </S.UpdateFrequencyLabel>
      </S.MixContainer>

      <S.MixContainer>
        <S.UpdateLabel>{t("calendarHeader.lastUpdate")}</S.UpdateLabel>
        <S.UpdateDateLabel>{lastUpdate} (local time)</S.UpdateDateLabel>
      </S.MixContainer>
    </S.HorizontalContainer>
  );
};

const CalendarActionButtons = () => {
  return (
    <>
      <S.MobileButtons>
        <ActionButton>
          <img src={bellAlert} />
        </ActionButton>
        <ActionButton>
          <img src={shareLink} />
        </ActionButton>
      </S.MobileButtons>

      <S.DesktopButtons>
        <Button onClick={() => {}}>
          COPY LINK <img src={copyLink} />
        </Button>
        <Button onClick={() => {}}>
          EXPORT SESSION <img src={downloadImage} />
        </Button>
      </S.DesktopButtons>
    </>
  );
};

const CalendarStationHeader = ({
  stationName,
  profile,
  sensor,
  lastUpdate,
  streamData,
}: CalendarStation) => {
  return (
    <S.Container>
      <StationValueLabel
        date={streamData.day}
        value={streamData.value}
        parameter={streamData.parameter}
      />

      <S.DetailsContainer>
        <S.ExtraContainer>
          <CalendarHeaderName stationName={stationName} />
          <CalendarStationProfileSensor profile={profile} sensor={sensor} />
        </S.ExtraContainer>

        <S.ExtraContainer>
          <CalendarUpdateOccurance lastUpdate={lastUpdate} />
          <CalendarActionButtons />
        </S.ExtraContainer>
      </S.DetailsContainer>
    </S.Container>
  );
};

export { CalendarStationHeader };

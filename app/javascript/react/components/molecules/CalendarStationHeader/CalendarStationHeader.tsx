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
        <S.RowContainer>
          <S.Subtitle>
            {t("calendarHeader.profile")}
          </S.Subtitle>
          <S.DataDescription>{profile}</S.DataDescription>
        </S.RowContainer>

        <S.RowContainer>
          <S.Subtitle>
            {t("calendarHeader.sensor")}
          </S.Subtitle>
          <S.DataDescription>{sensor}</S.DataDescription>
        </S.RowContainer>
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
      <S.RowContainer>
        <S.Subtitle>
          {t("calendarHeader.updateFrequencyTitle")}
        </S.Subtitle>
        <S.FrequencyLabel>
          {i18n.t("calendarHeader.updateFrequencyValue", { value: 15 })}
        </S.FrequencyLabel>
      </S.RowContainer>

      <S.RowContainer>
        <S.Subtitle>{t("calendarHeader.lastUpdate")}</S.Subtitle>
        <S.DateLabel>{lastUpdate} (local time)</S.DateLabel>
      </S.RowContainer>
    </S.HorizontalContainer>
  );
};

const CalendarActionButtons = () => {
  const { t } = useTranslation();

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
          {t("calendarHeader.copyLink")} <img src={copyLink} />
        </Button>
        <Button onClick={() => {}}>
          {t("calendarHeader.exportSession")} <img src={downloadImage} />
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
    <S.GridContainer>
      <StationValueLabel
        date={streamData.day}
        value={streamData.value}
        parameter={streamData.parameter}
      />
      <CalendarHeaderName stationName={stationName} />
      <CalendarStationProfileSensor profile={profile} sensor={sensor} />
      <CalendarUpdateOccurance lastUpdate={lastUpdate} />
      <CalendarActionButtons />
    </S.GridContainer>
  );
};

export { CalendarStationHeader };

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

const CalendarStationHeader = ({
  stationName,
  profile,
  sensor,
  lastUpdate,
  streamData,
}: CalendarStation) => {
  const { t, i18n } = useTranslation();

  return (
    <S.Container>
      <StationValueLabel
        date={streamData.day}
        value={streamData.value}
        parameter={streamData.parameter}
      />
      <S.DetailsContainer>
        <S.Description $minor>
          {t("calendarHeader.stationPrefix")}
        </S.Description>
        <S.Header>{stationName}</S.Header>

        <S.HorizontalContainer>
          <S.Label>{t("calendarHeader.profile")}</S.Label>
          <S.Value>{profile}</S.Value>
        </S.HorizontalContainer>

        <S.HorizontalContainer>
          <S.Label>{t("calendarHeader.sensor")}</S.Label>
          <S.Value>{sensor}</S.Value>
        </S.HorizontalContainer>
        <S.HorizontalContainer>
          <S.RowContainer>
            <S.UpdateLabel>
              {t("calendarHeader.updateFrequencyTitle")}
            </S.UpdateLabel>
            <S.UpdateLabel>{t("calendarHeader.lastUpdate")}</S.UpdateLabel>
          </S.RowContainer>

          <S.RowContainer>
            <S.UpdateFrequencyLabel>
              {i18n.t("calendarHeader.updateFrequencyValue", { value: 15 })}
            </S.UpdateFrequencyLabel>
            <S.UpdateDateLabel>{lastUpdate} (local time)</S.UpdateDateLabel>
          </S.RowContainer>
        </S.HorizontalContainer>
        <div>
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
        </div>
      </S.DetailsContainer>
    </S.Container>
  );
};

export { CalendarStationHeader };

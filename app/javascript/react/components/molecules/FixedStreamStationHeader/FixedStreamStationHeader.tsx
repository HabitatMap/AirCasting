import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import bellAlert from "../../../assets/icons/bellAlert.svg";
import copyLink from "../../../assets/icons/copyLink.svg";
import downloadImage from "../../../assets/icons/download.svg";
import { selectFixedStreamShortInfo } from "../../../store/fixedStreamSlice";
import shareLink from "../../../assets/icons/shareLink.svg";
import { ValueLabel } from "../ValueLabel";
import { ActionButton } from "../../ActionButton/ActionButton.style";
import { Button } from "../../Button/Button";
import * as S from "./FixedStreamStationHeader.style";
import { DataSource, StreamUpdate } from "../../../types/fixedStream";

const StationName: React.FC<{ stationName: string }> = ({ stationName }) => {
  const { t } = useTranslation();

  return (
    <S.HorizontalContainer>
      <S.Label>{t("calendarHeader.stationLabel")}</S.Label>
      <S.Heading>{stationName}</S.Heading>
    </S.HorizontalContainer>
  );
};

const DataSource: React.FC<DataSource> = ({ profile, sensorName }) => {
  const { t } = useTranslation();

  return (
    <S.HorizontalContainer>
      <S.RowContainer>
        <S.Subtitle>{t("calendarHeader.profile")}</S.Subtitle>
        <S.DataDescription>{profile}</S.DataDescription>
      </S.RowContainer>

      <S.RowContainer>
        <S.Subtitle>{t("calendarHeader.sensor")}</S.Subtitle>
        <S.DataDescription>{sensorName}</S.DataDescription>
      </S.RowContainer>
    </S.HorizontalContainer>
  );
};

const StreamUpdate: React.FC<StreamUpdate> = ({
  lastUpdate,
  updateFrequency,
}) => {
  const { t } = useTranslation();

  return (
    <S.HorizontalContainer>
      <S.RowContainer>
        <S.Subtitle>{t("calendarHeader.updateFrequencyTitle")}</S.Subtitle>
        <S.FrequencyLabel>{updateFrequency}</S.FrequencyLabel>
      </S.RowContainer>

      <S.RowContainer>
        <S.Subtitle>{t("calendarHeader.lastUpdate")}</S.Subtitle>
        <S.DateLabel>{lastUpdate}</S.DateLabel>
      </S.RowContainer>
    </S.HorizontalContainer>
  );
};

const StationActionButtons = () => {
  const { t } = useTranslation();

  return (
    <>
      <S.MobileButtons>
        <ActionButton
          onClick={() => {}}
          aria-labelledby={t("calendarHeader.altAlert")}
        >
          <img src={bellAlert} />
        </ActionButton>
        <ActionButton
          onClick={() => {}}
          aria-labelledby={t("calendarHeader.altShareLink")}
        >
          <img src={shareLink} />
        </ActionButton>
      </S.MobileButtons>

      <S.DesktopButtons>
        <Button
          onClick={() => {}}
          aria-labelledby={t("calendarHeader.altShareLink")}
        >
          {t("calendarHeader.copyLink")} <img src={copyLink} />
        </Button>
        <Button
          onClick={() => {}}
          aria-labelledby={t("calendarHeader.altExportSession")}
        >
          {t("calendarHeader.exportSession")} <img src={downloadImage} />
        </Button>
      </S.DesktopButtons>
    </>
  );
};

const FixedStreamStationHeader = () => {
  const {
    unitSymbol,
    title,
    profile,
    sensorName,
    lastUpdate,
    updateFrequency,
    lastMeasurementValue,
    lastMeasurementDateLabel,
  } = useSelector(selectFixedStreamShortInfo);

  return (
    <S.GridContainer>
      <ValueLabel
        date={lastMeasurementDateLabel}
        value={lastMeasurementValue}
        unitSymbol={unitSymbol}
      />
      <StationName stationName={title} />
      <DataSource profile={profile} sensorName={sensorName} />
      <StreamUpdate lastUpdate={lastUpdate} updateFrequency={updateFrequency} />
      <StationActionButtons />
    </S.GridContainer>
  );
};

export { FixedStreamStationHeader };

import React from "react";
import { useSelector } from "react-redux";

import { ValueLabel } from "./atoms/ValueLabel";
import { StationName } from "./atoms/StationName";
import { DataSource } from "./atoms/DataSource";
import { StreamUpdate } from "./atoms/StreamUpdate";
import { StationActionButtons } from "./atoms/StationActionButtons";
import { selectFixedStreamShortInfo } from "../../../store/fixedStreamSelectors";
import * as S from "./FixedStreamStationHeader.style";

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
    active,
    sessionId,
    startTime,
    endTime
  } = useSelector(selectFixedStreamShortInfo);

  return (
    <S.GridContainer>
      <ValueLabel
        date={lastMeasurementDateLabel}
        value={lastMeasurementValue}
        unitSymbol={unitSymbol}
        isActive={active}
      />
      <StationName stationName={title} />
      <DataSource profile={profile} sensorName={sensorName} />
      <StreamUpdate
        lastUpdate={lastUpdate}
        updateFrequency={updateFrequency}
        startTime={startTime}
        endTime={endTime}
      />
      <StationActionButtons sessionId={sessionId} />
    </S.GridContainer>
  );
};

export { FixedStreamStationHeader };

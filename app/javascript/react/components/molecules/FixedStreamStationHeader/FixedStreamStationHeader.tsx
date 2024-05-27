import React from "react";
import { useSelector } from "react-redux";
import moment from "moment";

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
    endTime,
  } = useSelector(selectFixedStreamShortInfo);

  const streamEndTime: string = endTime ?? lastUpdate ?? moment().format("YYYY-MM-DD");

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
        endTime={streamEndTime}
      />
      <StationActionButtons sessionId={sessionId} />
    </S.GridContainer>
  );
};

export { FixedStreamStationHeader };

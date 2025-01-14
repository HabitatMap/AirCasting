import moment from "moment";
import React from "react";
import { useSelector } from "react-redux";

import { selectFixedStreamShortInfo } from "../../../store/fixedStreamSelectors";
import { DateFormat } from "../../../types/dateFormat";
import { DataSource } from "./atoms/DataSource";
import { StationActionButtons } from "./atoms/StationActionButtons";
import { StationName } from "./atoms/StationName";
import { StreamUpdate } from "./atoms/StreamUpdate";
import { ValueLabel } from "./atoms/ValueLabel";
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

  const streamEndTime: string = endTime ?? moment().format(DateFormat.default);

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

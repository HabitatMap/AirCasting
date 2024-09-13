import moment from "moment";
import React from "react";

import { selectFixedStreamShortInfo } from "../../../store/fixedStreamSelectors";
import { useAppSelector } from "../../../store/hooks";
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
  } = useAppSelector(selectFixedStreamShortInfo);

  const streamEndTime: string =
    endTime ?? lastUpdate ?? moment().format(DateFormat.default);

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

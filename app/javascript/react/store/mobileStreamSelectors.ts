import { createSelector } from "@reduxjs/toolkit";

import moment from "moment";
import { Frequency } from "../types/graph";
import { MobileStream, MobileStreamShortInfo } from "../types/mobileStream";
import { Session } from "../types/sessionType";
import { RootState } from "./";
import { selectMobileSessionsState } from "./mobileSessionsSelectors";
import { initialState as mobileStreamInitialState } from "./mobileStreamSlice";

const selectMobileStreamData = (state: RootState): MobileStream =>
  state.mobileStream.data;

const selectMobileStreamPoints = createSelector(
  [selectMobileStreamData],
  (mobileStreamState): Session[] =>
    mobileStreamState.measurements.map(
      ({ time, value, latitude, longitude }, index) => ({
        id: index,
        lastMeasurementValue: value,
        time,
        point: {
          lat: latitude,
          lng: longitude,
          streamId: mobileStreamState.streamId.toString(),
        },
      })
    )
);

const selectMobileStreamShortInfo = createSelector(
  [selectMobileStreamData, selectMobileSessionsState],
  (mobileStreamData, mobileSessionState): MobileStreamShortInfo => {
    const maxMeasurementValue = Math.max(
      ...mobileStreamData.measurements.map((m) => m.value)
    );
    const minMeasurementValue = Math.min(
      ...mobileStreamData.measurements.map((m) => m.value)
    );

    const mobileSession = mobileSessionState.sessions.find(
      (session) => session.id === mobileStreamData.id
    );
    const sessionStreamData =
      mobileSession?.streams[Object.keys(mobileSession.streams)[0]];

    const formattedStartTime = mobileSession?.startTimeLocal
      ? moment.utc(mobileSession.startTimeLocal).format("MM/DD/YYYY HH:mm")
      : mobileStreamInitialState.data.startTime;

    const formattedEndTime = mobileSession?.endTimeLocal
      ? moment.utc(mobileSession.endTimeLocal).format("MM/DD/YYYY HH:mm")
      : mobileStreamInitialState.data.endTime;

    return {
      averageValue:
        sessionStreamData?.averageValue ||
        mobileStreamInitialState.data.averageValue,
      endTime: formattedEndTime,
      maxMeasurementValue,
      minMeasurementValue,
      profile: mobileStreamData.username,
      sensorName: mobileStreamData.sensorName,
      sessionId: mobileStreamData.id,
      startTime: formattedStartTime,
      title: mobileStreamData.title,
      unitSymbol: mobileStreamData.sensorUnit,
      updateFrequency: Frequency.OneMinute,
    };
  }
);

const selectMobileStreamStatus = (state: RootState) =>
  state.mobileStream.status;

export {
  selectMobileStreamData,
  selectMobileStreamPoints,
  selectMobileStreamShortInfo,
  selectMobileStreamStatus,
};

import { createSelector } from "@reduxjs/toolkit";

import moment from "moment";
import { MobileStream, MobileStreamShortInfo } from "../types/mobileStream";
import { MobileSession } from "../types/sessionType";
import { isValidValue } from "../utils/measurementsCalc";
import { RootState } from "./";
import { selectMobileSessionsState } from "./mobileSessionsSelectors";
import { initialState as mobileStreamInitialState } from "./mobileStreamSlice";

const selectMobileStreamData = (state: RootState): MobileStream =>
  state.mobileStream.data;

const selectMobileStreamPoints = createSelector(
  [selectMobileStreamData],
  (mobileStreamState): MobileSession[] =>
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
        notes: mobileStreamState.notes,
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
    };
  }
);

const selectMobileStreamStatus = (state: RootState) =>
  state.mobileStream.status;

const selectExtremesValues = (state: RootState) => state.mobileStream;

const selectMobileExtremes = createSelector(
  [selectExtremesValues],
  (mobileStreamData) => {
    const {
      averageMeasurementValue,
      minMeasurementValue,
      maxMeasurementValue,
    } = mobileStreamData;

    const min = isValidValue(minMeasurementValue)
      ? Math.round(minMeasurementValue!)
      : null;
    const max = isValidValue(maxMeasurementValue)
      ? Math.round(maxMeasurementValue!)
      : null;
    const avg = isValidValue(averageMeasurementValue)
      ? Math.round(averageMeasurementValue!)
      : null;

    return {
      minMeasurementValue: min,
      maxMeasurementValue: max,
      averageValue: avg,
    };
  }
);

export {
  selectMobileExtremes,
  selectMobileStreamData,
  selectMobileStreamPoints,
  selectMobileStreamShortInfo,
  selectMobileStreamStatus,
};

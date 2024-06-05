import { createSelector } from "reselect";

import { Session } from "../components/Map/Markers/SessionType";
import { RootState } from "./";

const selectMobileSessionsState = (state: RootState) => state.mobileSessions;

const selectMobileSessionsData = createSelector(
  [selectMobileSessionsState],
  (mobileSessionsState): Session[] =>
    mobileSessionsState.sessions.map(({ id, streams }) => ({
      id,
      lastMeasurementValue: streams[Object.keys(streams)[0]].averageValue,
      point: {
        lat: streams[Object.keys(streams)[0]].startLatitude,
        lng: streams[Object.keys(streams)[0]].startLongitude,
        streamId: streams[Object.keys(streams)[0]].id.toString(),
      },
    }))
);

export { selectMobileSessionsData, selectMobileSessionsState };

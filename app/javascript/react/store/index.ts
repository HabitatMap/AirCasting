import { configureStore } from "@reduxjs/toolkit";

import clusterReducer from "./clusterSlice";
import crowdMapReducer from "./crowdMapSlice";
import sessionReducer from "./exportSessionSlice";
import fixedSessionsReducer from "./fixedSessionsSlice";
import fixedStreamReducer from "./fixedStreamSlice";
import indoorSessionsReducer from "./indoorSessionsSlice";
import { selectIsLoading } from "./loadingSelectors";
import mapReducer from "./mapSlice";
import markersLoadingReducer from "./markersLoadingSlice";
import mobileSessionsReducer from "./mobileSessionsSlice";
import mobileStreamReducer from "./mobileStreamSlice";
import movingStreamReducer from "./movingCalendarStreamSlice";
import popoverReducer from "./popoverSlice";
import realtimeMapUpdatesReducer from "./realtimeMapUpdatesSlice";
import rectangleReducer from "./rectangleSlice";
import sensorsReducer from "./sensorsSlice";
import sessionFilterReducer from "./sessionFiltersSlice";
import thresholdReducer from "./thresholdSlice";
import timelapseReducer from "./timelapseSlice";
const store = configureStore({
  reducer: {
    cluster: clusterReducer,
    crowdMap: crowdMapReducer,
    fixedSessions: fixedSessionsReducer,
    fixedStream: fixedStreamReducer,
    indoorSessions: indoorSessionsReducer,
    map: mapReducer,
    markersLoading: markersLoadingReducer,
    mobileSessions: mobileSessionsReducer,
    mobileStream: mobileStreamReducer,
    movingCalendarStream: movingStreamReducer,
    popover: popoverReducer,
    realtimeMapUpdates: realtimeMapUpdatesReducer,
    rectangle: rectangleReducer,
    sensors: sensorsReducer,
    session: sessionReducer,
    sessionFilter: sessionFilterReducer,
    threshold: thresholdReducer,
    timelapse: timelapseReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export { selectIsLoading };
export default store;

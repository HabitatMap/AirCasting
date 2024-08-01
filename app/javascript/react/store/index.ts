import { configureStore } from "@reduxjs/toolkit";

import clusterReducer from "./clusterSlice";
import crowdMapReducer from "./crowdMapSlice";
import sessionReducer from "./exportSessionSlice";
import fixedSessionsReducer from "./fixedSessionsSlice";
import fixedStreamReducer from "./fixedStreamSlice";
import mapReducer from "./mapSlice";
import mobileSessionsReducer from "./mobileSessionsSlice";
import mobileStreamReducer from "./mobileStreamSlice";
import movingStreamReducer from "./movingCalendarStreamSlice";
import sessionFilterReducer from "./sessionFiltersSlice";
import thresholdReducer from "./thresholdSlice";

const store = configureStore({
  reducer: {
    cluster: clusterReducer,
    crowdMap: crowdMapReducer,
    fixedSessions: fixedSessionsReducer,
    fixedStream: fixedStreamReducer,
    map: mapReducer,
    mobileSessions: mobileSessionsReducer,
    mobileStream: mobileStreamReducer,
    movingCalendarStream: movingStreamReducer,
    session: sessionReducer,
    threshold: thresholdReducer,
    sessionFilter: sessionFilterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;

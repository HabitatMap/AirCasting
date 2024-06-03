import { configureStore } from "@reduxjs/toolkit";

import sessionReducer from "./exportSessionSlice";
import fixedSessionsSlice from "./fixedSessionsSlice";
import fixedStreamReducer from "./fixedStreamSlice";
import mapReducer from "./mapSlice";
import mobileSessionsSlice from "./mobileSessionsSlice";
import movingStreamSlice from "./movingCalendarStreamSlice";
import thresholdReducer from "./thresholdSlice";

const store = configureStore({
  reducer: {
    threshold: thresholdReducer,
    fixedStream: fixedStreamReducer,
    session: sessionReducer,
    movingCalendarStream: movingStreamSlice,
    map: mapReducer,
    fixedSessions: fixedSessionsSlice,
    mobileSessions: mobileSessionsSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;

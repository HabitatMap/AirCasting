import { configureStore } from "@reduxjs/toolkit";

import thresholdReducer from "./thresholdSlice";
import fixedStreamReducer from "./fixedStreamSlice";
import sessionReducer from "./exportSessionSlice";
import movingStreamSlice  from "./movingCalendarStreamSlice";

const store = configureStore({
  reducer: {
    threshold: thresholdReducer,
    fixedStream: fixedStreamReducer,
    session: sessionReducer,
    movingCalendarStream: movingStreamSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;

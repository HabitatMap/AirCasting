import { configureStore } from "@reduxjs/toolkit";

import thresholdReducer from "./thresholdSlice";
import fixedStreamReducer from "./fixedStreamSlice";
import sessionReducer from "./exportSessionSlice";

const store = configureStore({
  reducer: {
    threshold: thresholdReducer,
    fixedStream: fixedStreamReducer,
    session: sessionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;

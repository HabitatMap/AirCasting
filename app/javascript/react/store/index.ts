import { configureStore } from "@reduxjs/toolkit";

import thresholdReducer from "./thresholdSlice";
import fixedStreamReducer from "./fixedStreamSlice";

const store = configureStore({
  reducer: {
    threshold: thresholdReducer,
    fixedStream: fixedStreamReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;

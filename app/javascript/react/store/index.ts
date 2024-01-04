import { configureStore } from "@reduxjs/toolkit";

import thresholdReducer from "./thresholdSlice";

const store = configureStore({
  reducer: {
    threshold: thresholdReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;

import { configureStore } from "@reduxjs/toolkit";
import { RootState } from "../../store";

export const createMockStore = (initialState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      fixedSessions: () => ({
        points: [],
        list: [],
        status: "idle",
        activeSessions: [],
        dormantSessions: [],
        isActiveSessionsFetched: false,
        isDormantSessionsFetched: false,
        fetchableSessionsCount: 0,
        error: null,
        ...initialState?.fixedSessions,
      }),
      mobileSessions: () => ({
        points: [],
        list: [],
        status: "idle",
        ...initialState?.mobileSessions,
      }),
      fixedStream: () => ({
        measurements: [],
        dailyAverages: [],
        thresholds: [],
        ...initialState?.fixedStream,
      }),
      mobileStream: () => ({
        measurements: [],
        dailyAverages: [],
        thresholds: [],
        ...initialState?.mobileStream,
      }),
      cluster: () => ({
        ...initialState?.cluster,
      }),
      crowdMap: () => ({
        ...initialState?.crowdMap,
      }),
      indoorSessions: () => ({
        ...initialState?.indoorSessions,
      }),
      map: () => ({
        ...initialState?.map,
      }),
      markersLoading: () => ({
        ...initialState?.markersLoading,
      }),
      movingCalendarStream: () => ({
        ...initialState?.movingCalendarStream,
      }),
      realtimeMapUpdates: () => ({
        ...initialState?.realtimeMapUpdates,
      }),
      rectangle: () => ({
        ...initialState?.rectangle,
      }),
      sensors: () => ({
        ...initialState?.sensors,
      }),
      sessionFilter: () => ({
        ...initialState?.sessionFilter,
      }),
      threshold: () => ({
        ...initialState?.threshold,
      }),
      timelapse: () => ({
        ...initialState?.timelapse,
      }),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
};

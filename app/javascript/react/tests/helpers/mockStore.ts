import { configureStore } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { StatusEnum } from "../../types/api";
import { FixedTimeRange } from "../../types/timeRange";

export const createMockStore = (initialState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      fixedSessions: () => ({
        points: [],
        list: [],
        status: StatusEnum.Idle,
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
        status: StatusEnum.Idle,
        fetchableSessionsCount: 0,
        sessions: [],
        error: null,
        ...initialState?.mobileSessions,
      }),
      fixedStream: () => ({
        data: {
          stream: {
            title: "",
            profile: "",
            lastUpdate: "",
            sensorName: "",
            unitSymbol: "",
            updateFrequency: "",
            active: false,
            sessionId: 0,
            startTime: "",
            endTime: "",
            min: 0,
            low: 0,
            middle: 0,
            high: 0,
            max: 0,
            latitude: 0,
            longitude: 0,
          },
          measurements: [],
          streamDailyAverages: [],
          lastMonthMeasurements: [],
        },
        fetchedStartTime: null,
        minMeasurementValue: null,
        maxMeasurementValue: null,
        averageMeasurementValue: null,
        status: StatusEnum.Idle,
        error: null,
        isLoading: false,
        lastSelectedTimeRange: FixedTimeRange.Day,
        measurements: {},
        fetchedTimeRanges: {},
        ...initialState?.fixedStream,
      }),
      mobileStream: () => ({
        measurements: [],
        dailyAverages: [],
        thresholds: [],
        data: {
          stream: {
            id: 0,
            title: "",
            lastMeasurementValue: 0,
          },
          measurements: [],
        },
        ...initialState?.mobileStream,
      }),
      cluster: () => ({
        clusterAverage: null,
        clusterSize: null,
        loading: false,
        visible: false,
        ...initialState?.cluster,
      }),
      crowdMap: () => ({
        error: null,
        data: null,
        status: StatusEnum.Idle,
        fetchingData: false,
        rectangles: [],
        ...initialState?.crowdMap,
      }),
      indoorSessions: () => ({
        points: [],
        list: [],
        status: StatusEnum.Idle,
        activeSessions: [],
        dormantSessions: [],
        isActiveSessionsFetched: false,
        isDormantSessionsFetched: false,
        fetchableSessionsCount: 0,
        error: null,
        activeIndoorSessions: [],
        dormantIndoorSessions: [],
        ...initialState?.indoorSessions,
      }),
      map: () => ({
        fetchingData: false,
        hoverStreamId: null,
        mapId: "",
        position: null,
        sessionsListExpanded: false,
        ...initialState?.map,
      }),
      markersLoading: () => ({
        isLoading: false,
        totalMarkers: 0,
        loadedMarkers: 0,
        ...initialState?.markersLoading,
      }),
      movingCalendarStream: () => {
        const defaultData = [
          {
            date: "2024-04-24",
            value: 4,
          },
          {
            date: "2024-04-25",
            value: 6,
          },
          {
            date: "2024-04-26",
            value: 6,
          },
          {
            date: "2024-04-27",
            value: 7,
          },
          {
            date: "2024-04-28",
            value: 9,
          },
          {
            date: "2024-04-29",
            value: 4,
          },
          {
            date: "2024-04-30",
            value: 3,
          },
        ];
        return {
          data: initialState?.movingCalendarStream?.data || defaultData,
          status: StatusEnum.Fulfilled,
          error: null,
          ...initialState?.movingCalendarStream,
        };
      },
      popover: () => ({
        isOpen: false,
        ...initialState?.popover,
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
      session: () => ({
        data: null,
        status: StatusEnum.Idle,
        error: null,
        ...initialState?.session,
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

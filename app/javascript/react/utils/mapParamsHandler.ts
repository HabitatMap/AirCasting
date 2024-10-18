import { debounce } from "lodash";
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { MAP_CONFIGS } from "../components/Map/mapConfigs";
import { defaultGridSize } from "../components/SessionFilters/CrowdMapGridSize";
import { getSensorUnitSymbol } from "../components/SessionFilters/SensorFilter";
import {
  beginningOfTheYear,
  endOfTheYear,
  getLastFiveYears,
} from "../components/SessionFilters/YearPickerButtons";
import { FALSE, TRUE } from "../const/booleans";
import {
  DEFAULT_MAP_BOUNDS,
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
} from "../const/coordinates";
import { useAppSelector } from "../store/hooks";
import {
  selectDefaultThresholds,
  selectThresholds,
} from "../store/thresholdSlice";
import {
  ParameterType,
  ParameterTypes,
  SessionType,
  SessionTypes,
  UnitSymbols,
} from "../types/filters";
import { Sensor, SENSOR_NAMES, SensorPrefix } from "../types/sensors";
import { UserSettings } from "../types/userStates";
import useMobileDetection from "../utils/useScreenSizeDetection";
import * as Cookies from "./cookies";
import { setSensor } from "./setSensor";

export enum UrlParamsTypes {
  boundEast = "boundEast",
  boundNorth = "boundNorth",
  boundSouth = "boundSouth",
  boundWest = "boundWest",
  currentCenter = "currentCenter",
  currentUserSettings = "currentUserSettings",
  currentZoom = "currentZoom",
  fetchedSessions = "fetchedSessions",
  gridSize = "gridSize",
  isActive = "isActive",
  isIndoor = "isIndoor",
  limit = "limit",
  mapType = "mapType",
  measurementType = "measurementType",
  offset = "offset",
  previousCenter = "previousCenter",
  previousUserSettings = "previousUserSettings",
  previousZoom = "previousZoom",
  sensorName = "sensorName",
  sessionId = "sessionId",
  sessionType = "sessionType",
  streamId = "streamId",
  thresholdMin = "thresholdMin",
  thresholdLow = "thresholdLow",
  thresholdMiddle = "thresholdMiddle",
  thresholdHigh = "thresholdHigh",
  thresholdMax = "thresholdMax",
  unitSymbol = "unitSymbol",
  usernames = "usernames",
  tags = "tags",
  timeFrom = "timeFrom",
  timeTo = "timeTo",
}

export const useMapParams = () => {
  const defaultThresholds = useAppSelector(selectDefaultThresholds);
  const thresholdValues = useAppSelector(selectThresholds);
  const isMobile: boolean = useMobileDetection();
  const [searchParams, setSearchParams] = useSearchParams();

  const getStoredParam = useCallback(
    (param: UrlParamsTypes, defaultValue: string | null): string | null => {
      const storedValue = localStorage.getItem(param);
      const cookieValue = Cookies.get(param);

      if (searchParams.get(param)) {
        return searchParams.get(param);
        // } else if (sessionStoredValue === null && storedValue !== null) {
        //   return storedValue;
      } else if (cookieValue !== null) {
        return cookieValue;
      }
      // jeśli sessionStorage jest puste to weź z localStorage, a tak to z session
      // else if (storedValue !== null) {
      //   return storedValue;
      // }
      else {
        return defaultValue;
      }
    },
    [searchParams, setSearchParams]
  );

  // const getStoredOrSearchParam = (
  //   param: UrlParamsTypes,
  //   defaultValue: string | null
  // ): string | null => searchParams.get(param) ?? defaultValue;

  // const getStoredParam = (
  //   param: UrlParamsTypes,
  //   defaultValue: string | null
  // ): string | null => {
  //   // const storedValue = localStorage.getItem(param);
  //   const cookieValue = Cookies.get(param);
  //   const isVisited = sessionStorage.getItem("isVisited");

  //   return isVisited === null && cookieValue !== null
  //     ? cookieValue
  //     : searchParams.get(param) ?? defaultValue;
  // };

  const setUrlAndLocalStorageParams = useCallback(
    (params: Array<{ key: UrlParamsTypes; value: string }>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      params.forEach(({ key, value }) => {
        newSearchParams.set(key, value);
        // localStorage.setItem(key, value);
        // sessionStorage.setItem(key, value);
      });
      setSearchParams(`?${newSearchParams.toString()}`);
    },
    [searchParams, setSearchParams]
  );

  const boundEast = parseFloat(
    getStoredParam(
      UrlParamsTypes.boundEast,
      DEFAULT_MAP_BOUNDS.east.toString()
    )!
  );
  const boundNorth = parseFloat(
    getStoredParam(
      UrlParamsTypes.boundNorth,
      DEFAULT_MAP_BOUNDS.north.toString()
    )!
  );
  const boundSouth = parseFloat(
    getStoredParam(
      UrlParamsTypes.boundSouth,
      DEFAULT_MAP_BOUNDS.south.toString()
    )!
  );
  const boundWest = parseFloat(
    getStoredParam(
      UrlParamsTypes.boundWest,
      DEFAULT_MAP_BOUNDS.west.toString()
    )!
  );
  const currentCenter = useMemo(
    () =>
      JSON.parse(
        getStoredParam(
          UrlParamsTypes.currentCenter,
          JSON.stringify(DEFAULT_MAP_CENTER)
        )!
      ),
    [searchParams]
  );
  const currentUserSettings = getStoredParam(
    UrlParamsTypes.currentUserSettings,
    UserSettings.MapView
  ) as UserSettings;
  const currentZoom = parseFloat(
    getStoredParam(UrlParamsTypes.currentZoom, DEFAULT_ZOOM.toString())!
  );

  const isIndoor = getStoredParam(UrlParamsTypes.isIndoor, FALSE);
  const currentYear = new Date().getFullYear();

  const gridSize = parseInt(
    getStoredParam(UrlParamsTypes.gridSize, defaultGridSize.toString())!
  );
  const limit = parseInt(getStoredParam(UrlParamsTypes.limit, "100")!);
  const updateLimit = useCallback(
    (newLimit: number) => {
      setUrlAndLocalStorageParams([
        { key: UrlParamsTypes.limit, value: newLimit.toString() },
      ]);
    },
    [setUrlAndLocalStorageParams]
  );

  const mapTypeId =
    getStoredParam(UrlParamsTypes.mapType, MAP_CONFIGS[0].mapTypeId) ||
    MAP_CONFIGS[0].mapTypeId;

  const measurementType = getStoredParam(
    UrlParamsTypes.measurementType,
    ParameterTypes.PARTICULATE_MATTER
  )!;

  const offset = parseInt(getStoredParam(UrlParamsTypes.offset, "0")!);
  const updateOffset = useCallback(
    (newOffset: number) => {
      setUrlAndLocalStorageParams([
        { key: UrlParamsTypes.offset, value: newOffset.toString() },
      ]);
    },
    [setUrlAndLocalStorageParams]
  );

  const fetchedSessions = parseInt(
    getStoredParam(UrlParamsTypes.fetchedSessions, "0")!
  );
  const updateFetchedSessions = useCallback(
    (newFetchedSessions: number) => {
      setUrlAndLocalStorageParams([
        {
          key: UrlParamsTypes.fetchedSessions,
          value: newFetchedSessions.toString(),
        },
      ]);
    },
    [setUrlAndLocalStorageParams]
  );
  const previousCenter = useMemo(
    () =>
      JSON.parse(
        getStoredParam(
          UrlParamsTypes.previousCenter,
          JSON.stringify(DEFAULT_MAP_CENTER)
        )!
      ),
    [searchParams]
  );
  const previousUserSettings = getStoredParam(
    UrlParamsTypes.previousUserSettings,
    UserSettings.MapView
  ) as UserSettings;

  const updatePreviousUserSettings = useCallback(
    (selectedPreviousUserSettings: UserSettings) => {
      setUrlAndLocalStorageParams([
        {
          key: UrlParamsTypes.previousUserSettings,
          value: selectedPreviousUserSettings,
        },
      ]);
    },
    [setUrlAndLocalStorageParams]
  );
  const previousZoom = parseFloat(
    getStoredParam(UrlParamsTypes.previousZoom, DEFAULT_ZOOM.toString())!
  );
  const sensorName = getStoredParam(
    UrlParamsTypes.sensorName,
    SENSOR_NAMES.PARTICULATE_MATTER.GOVERNMENT_PM25
  )!;
  const sessionId =
    getStoredParam(UrlParamsTypes.sessionId, null) !== null
      ? parseInt(getStoredParam(UrlParamsTypes.sessionId, "0")!)
      : null;
  const sessionType = useMemo(
    () =>
      getStoredParam(
        UrlParamsTypes.sessionType,
        SessionTypes.FIXED
      ) as SessionType,
    [searchParams]
  );
  const updateSessionType = useCallback(
    (selectedSessionType: SessionType) => {
      setUrlAndLocalStorageParams([
        { key: UrlParamsTypes.sessionType, value: selectedSessionType },
        {
          key: UrlParamsTypes.previousUserSettings,
          value: currentUserSettings,
        },
        {
          key: UrlParamsTypes.currentUserSettings,
          value: isMobile ? UserSettings.FiltersView : UserSettings.MapView,
        },
        {
          key: UrlParamsTypes.sessionId,
          value: "",
        },
        {
          key: UrlParamsTypes.streamId,
          value: "",
        },
        {
          key: UrlParamsTypes.measurementType,
          value: ParameterTypes.PARTICULATE_MATTER,
        },
        {
          key: UrlParamsTypes.sensorName,
          value:
            selectedSessionType === SessionTypes.FIXED
              ? SENSOR_NAMES.PARTICULATE_MATTER.GOVERNMENT_PM25
              : SENSOR_NAMES.PARTICULATE_MATTER.AIRBEAM_PM25,
        },
        {
          key: UrlParamsTypes.unitSymbol,
          value: UnitSymbols.ParticulateMatter,
        },
        {
          key: UrlParamsTypes.usernames,
          value: "",
        },
        {
          key: UrlParamsTypes.tags,
          value: "",
        },
        {
          key: UrlParamsTypes.isIndoor,
          value: FALSE,
        },
        { key: UrlParamsTypes.isActive, value: TRUE },
        {
          key: UrlParamsTypes.timeFrom,
          value: beginningOfTheYear(getLastFiveYears()[0]).toString(),
        },
        {
          key: UrlParamsTypes.timeTo,
          value: endOfTheYear(getLastFiveYears()[0]).toString(),
        },
      ]);
    },
    [currentUserSettings, setUrlAndLocalStorageParams]
  );

  const isActive = useMemo(() => {
    const activeParam = getStoredParam(UrlParamsTypes.isActive, TRUE);

    if (sessionType === SessionTypes.MOBILE) {
      return true;
    }

    return activeParam === TRUE;
  }, [searchParams, sessionType]);

  const updateIsActive = useCallback(
    (newIsActive: boolean) => {
      if (sessionType === SessionTypes.MOBILE) {
        newIsActive = true;
      }
      setUrlAndLocalStorageParams([
        {
          key: UrlParamsTypes.previousUserSettings,
          value: currentUserSettings,
        },
        {
          key: UrlParamsTypes.currentUserSettings,
          value: isMobile
            ? UserSettings.FiltersView
            : currentUserSettings === UserSettings.CrowdMapView
            ? UserSettings.CrowdMapView
            : UserSettings.MapView,
        },
        {
          key: UrlParamsTypes.sessionId,
          value: "",
        },
        {
          key: UrlParamsTypes.streamId,
          value: "",
        },
        {
          key: UrlParamsTypes.timeFrom,
          value: beginningOfTheYear(currentYear).toString(),
        },
        {
          key: UrlParamsTypes.timeTo,
          value: endOfTheYear(currentYear).toString(),
        },
        { key: UrlParamsTypes.isActive, value: newIsActive.toString() },
      ]);
    },
    [sessionType, setUrlAndLocalStorageParams, currentYear]
  );

  const streamId =
    getStoredParam(UrlParamsTypes.streamId, null) !== null
      ? parseInt(getStoredParam(UrlParamsTypes.streamId, "0")!)
      : null;
  const tags = getStoredParam(UrlParamsTypes.tags, "");
  const initialThresholds = useMemo(
    () => ({
      min: parseFloat(
        getStoredParam(
          UrlParamsTypes.thresholdMin,
          defaultThresholds.min.toString()
        )!
      ),
      low: parseFloat(
        getStoredParam(
          UrlParamsTypes.thresholdLow,
          defaultThresholds.low.toString()
        )!
      ),
      middle: parseFloat(
        getStoredParam(
          UrlParamsTypes.thresholdMiddle,
          defaultThresholds.middle.toString()
        )!
      ),
      high: parseFloat(
        getStoredParam(
          UrlParamsTypes.thresholdHigh,
          defaultThresholds.high.toString()
        )!
      ),
      max: parseFloat(
        getStoredParam(
          UrlParamsTypes.thresholdMax,
          defaultThresholds.max.toString()
        )!
      ),
    }),
    [defaultThresholds]
  );
  const timeFrom = getStoredParam(
    UrlParamsTypes.timeFrom,
    beginningOfTheYear(getLastFiveYears()[0]).toString()
  )!;
  const timeTo = getStoredParam(
    UrlParamsTypes.timeTo,
    endOfTheYear(getLastFiveYears()[0]).toString()
  )!;
  const unitSymbol = getStoredParam(
    UrlParamsTypes.unitSymbol,
    UnitSymbols.ParticulateMatter
  )!;
  const usernames = getStoredParam(UrlParamsTypes.usernames, "");

  useEffect(() => {
    const queryParams = new URLSearchParams(searchParams.toString());
    // temporary solution -> later we'll move thresholds to URL

    queryParams.set(
      UrlParamsTypes.thresholdMin,
      thresholdValues.min.toString()
    );
    thresholdValues.low !== 0 &&
      queryParams.set(
        UrlParamsTypes.thresholdLow,
        thresholdValues.low.toString()
      );
    thresholdValues.middle !== 0 &&
      queryParams.set(
        UrlParamsTypes.thresholdMiddle,
        thresholdValues.middle.toString()
      );
    thresholdValues.high !== 0 &&
      queryParams.set(
        UrlParamsTypes.thresholdHigh,
        thresholdValues.high.toString()
      );
    thresholdValues.max !== 0 &&
      queryParams.set(
        UrlParamsTypes.thresholdMax,
        thresholdValues.max.toString()
      );

    debouncedUpdateURL(queryParams);
    localStorage.setItem(
      UrlParamsTypes.thresholdMin,
      thresholdValues.min.toString()
    );
    localStorage.setItem(
      UrlParamsTypes.thresholdLow,
      thresholdValues.low.toString()
    );
    localStorage.setItem(
      UrlParamsTypes.thresholdMiddle,
      thresholdValues.middle.toString()
    );
    localStorage.setItem(
      UrlParamsTypes.thresholdHigh,
      thresholdValues.high.toString()
    );
    localStorage.setItem(
      UrlParamsTypes.thresholdMax,
      thresholdValues.max.toString()
    );
    // sessionStorage.setItem(
    //   UrlParamsTypes.thresholdMin,
    //   thresholdValues.min.toString()
    // );
    // sessionStorage.setItem(
    //   UrlParamsTypes.thresholdLow,
    //   thresholdValues.low.toString()
    // );
    // sessionStorage.setItem(
    //   UrlParamsTypes.thresholdMiddle,
    //   thresholdValues.middle.toString()
    // );
    // sessionStorage.setItem(
    //   UrlParamsTypes.thresholdHigh,
    //   thresholdValues.high.toString()
    // );
    // sessionStorage.setItem(
    //   UrlParamsTypes.thresholdMax,
    //   thresholdValues.max.toString()
    // );
  }, [thresholdValues]);

  const goToUserSettings = useCallback(
    (newUserSettings: UserSettings) => {
      setUrlAndLocalStorageParams([
        {
          key: UrlParamsTypes.previousUserSettings,
          value: currentUserSettings,
        },
        {
          key: UrlParamsTypes.currentUserSettings,
          value: newUserSettings,
        },
      ]);
    },
    [searchParams]
  );

  const revertUserSettingsAndResetIds = useCallback(() => {
    const finalPreviousUserSettings =
      !isMobile && previousUserSettings === UserSettings.CalendarView
        ? UserSettings.MapView
        : previousUserSettings;

    setUrlAndLocalStorageParams([
      { key: UrlParamsTypes.sessionId, value: "" },
      { key: UrlParamsTypes.streamId, value: "" },
      {
        key: UrlParamsTypes.previousUserSettings,
        value: currentUserSettings,
      },
      {
        key: UrlParamsTypes.currentUserSettings,
        value: finalPreviousUserSettings,
      },
    ]);
  }, [
    searchParams,
    previousUserSettings,
    currentUserSettings,
    setUrlAndLocalStorageParams,
  ]);

  const setFilter = useCallback(
    (key: UrlParamsTypes, value: string) => {
      if (isMobile) {
        setUrlAndLocalStorageParams([
          {
            key: key,
            value: value,
          },
        ]);
      } else {
        setUrlAndLocalStorageParams([
          {
            key: key,
            value: value,
          },
          {
            key: UrlParamsTypes.previousUserSettings,
            value: currentUserSettings,
          },
          {
            key: UrlParamsTypes.currentUserSettings,
            value:
              currentUserSettings === UserSettings.CrowdMapView
                ? UserSettings.CrowdMapView
                : UserSettings.MapView,
          },
          {
            key: UrlParamsTypes.sessionId,
            value: "",
          },
          {
            key: UrlParamsTypes.streamId,
            value: "",
          },
        ]);
      }
    },
    [searchParams]
  );

  const updateIndoorFilters = useCallback(
    (isIndoor: string) => {
      if (isMobile) {
        setUrlAndLocalStorageParams([
          {
            key: UrlParamsTypes.isIndoor,
            value: isIndoor,
          },
          { key: UrlParamsTypes.usernames, value: "" },
        ]);
      } else {
        setUrlAndLocalStorageParams([
          {
            key: UrlParamsTypes.isIndoor,
            value: isIndoor,
          },
          { key: UrlParamsTypes.usernames, value: "" },
          {
            key: UrlParamsTypes.previousUserSettings,
            value: currentUserSettings,
          },
          {
            key: UrlParamsTypes.currentUserSettings,
            value:
              currentUserSettings === UserSettings.CrowdMapView
                ? UserSettings.CrowdMapView
                : UserSettings.MapView,
          },
          {
            key: UrlParamsTypes.sessionId,
            value: "",
          },
          {
            key: UrlParamsTypes.streamId,
            value: "",
          },
        ]);
      }
    },
    [searchParams]
  );

  const updateTime = useCallback(
    (selectedYear: number) => {
      setUrlAndLocalStorageParams([
        {
          key: UrlParamsTypes.previousUserSettings,
          value: isMobile ? previousUserSettings : currentUserSettings,
        },
        {
          key: UrlParamsTypes.currentUserSettings,
          value: isMobile
            ? UserSettings.FiltersView
            : currentUserSettings === UserSettings.CrowdMapView
            ? UserSettings.CrowdMapView
            : UserSettings.MapView,
        },
        {
          key: UrlParamsTypes.sessionId,
          value: "",
        },
        {
          key: UrlParamsTypes.streamId,
          value: "",
        },
        {
          key: UrlParamsTypes.timeFrom,
          value: beginningOfTheYear(selectedYear).toString(),
        },
        {
          key: UrlParamsTypes.timeTo,
          value: endOfTheYear(selectedYear).toString(),
        },
      ]);
    },
    [
      beginningOfTheYear,
      currentUserSettings,
      endOfTheYear,
      setUrlAndLocalStorageParams,
    ]
  );

  const debouncedUpdateURL = useCallback(
    debounce((params) => {
      setSearchParams(params);
    }, 300),
    [setSearchParams]
  );

  const setParameterParams = useCallback(
    (selectedParameter: ParameterType, sensors: Sensor[]) => {
      const sensorData = setSensor(selectedParameter, sensors, sessionType);
      const commonParams = [
        {
          key: UrlParamsTypes.previousUserSettings,
          value: currentUserSettings,
        },
        {
          key: UrlParamsTypes.currentUserSettings,
          value: isMobile
            ? UserSettings.FiltersView
            : currentUserSettings === UserSettings.CrowdMapView
            ? UserSettings.CrowdMapView
            : UserSettings.MapView,
        },
        {
          key: UrlParamsTypes.sessionId,
          value: "",
        },
        {
          key: UrlParamsTypes.streamId,
          value: "",
        },
        {
          key: UrlParamsTypes.measurementType,
          value: selectedParameter,
        },
        {
          key: UrlParamsTypes.sensorName,
          value: sensorData.sensorName,
        },
        {
          key: UrlParamsTypes.unitSymbol,
          value: sensorData.unitSymbol,
        },
      ];

      setUrlAndLocalStorageParams(commonParams);

      if (
        isIndoor === TRUE &&
        sensorData.sensorName.startsWith(SensorPrefix.GOVERNMENT)
      ) {
        setUrlAndLocalStorageParams([
          ...commonParams,
          {
            key: UrlParamsTypes.isIndoor,
            value: FALSE,
          },
        ]);
      }
    },
    [setUrlAndLocalStorageParams, setSensor]
  );

  const setSensorParams = useCallback(
    (selectedSensor: string, sensors: Sensor[]) => {
      const commonParams = [
        {
          key: UrlParamsTypes.previousUserSettings,
          value: currentUserSettings,
        },
        {
          key: UrlParamsTypes.currentUserSettings,
          value: isMobile
            ? UserSettings.FiltersView
            : currentUserSettings === UserSettings.CrowdMapView
            ? UserSettings.CrowdMapView
            : UserSettings.MapView,
        },
        {
          key: UrlParamsTypes.sessionId,
          value: "",
        },
        {
          key: UrlParamsTypes.streamId,
          value: "",
        },
        {
          key: UrlParamsTypes.sensorName,
          value: selectedSensor,
        },
        {
          key: UrlParamsTypes.unitSymbol,
          value: getSensorUnitSymbol(selectedSensor, sensors),
        },
      ];

      setUrlAndLocalStorageParams(commonParams);

      if (
        isIndoor === TRUE &&
        selectedSensor.startsWith(SensorPrefix.GOVERNMENT)
      ) {
        setUrlAndLocalStorageParams([
          ...commonParams,
          {
            key: UrlParamsTypes.isIndoor,
            value: FALSE,
          },
        ]);
      }
    },
    [setUrlAndLocalStorageParams, getSensorUnitSymbol]
  );

  return {
    boundEast,
    boundNorth,
    boundSouth,
    boundWest,
    currentCenter,
    currentUserSettings,
    currentZoom,
    fetchedSessions,
    goToUserSettings,
    gridSize,
    isActive,
    isIndoor,
    limit,
    mapTypeId,
    measurementType,
    offset,
    previousCenter,
    previousUserSettings,
    updatePreviousUserSettings,
    previousZoom,
    revertUserSettingsAndResetIds,
    sensorName,
    sessionId,
    sessionType,
    updateSessionType,
    setFilter,
    setUrlAndLocalStorageParams,
    streamId,
    initialThresholds,
    searchParams,
    tags,
    timeFrom,
    timeTo,
    updateTime,
    unitSymbol,
    updateFetchedSessions,
    updateLimit,
    updateOffset,
    updateIsActive,
    updateIndoorFilters,
    setSensorParams,
    usernames,
    setParameterParams,
  };
};

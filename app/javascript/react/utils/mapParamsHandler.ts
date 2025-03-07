import { debounce } from "lodash";
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { defaultGridSize } from "../components/molecules/SessionFilters/CrowdMapGridSize";
import { getSensorUnitSymbol } from "../components/molecules/SessionFilters/SensorFilter";
import {
  beginningOfTheYear,
  endOfTheYear,
  getLastFiveYears,
} from "../components/molecules/SessionFilters/YearPickerButtons";
import { MAP_CONFIGS } from "../components/organisms/Map/mapUtils/mapConfigs";
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

  const getParam = useCallback(
    (param: UrlParamsTypes, defaultValue: string | null): string | null => {
      const cookieValue = Cookies.get(param);

      if (searchParams.get(param)) {
        return searchParams.get(param);
      } else if (cookieValue !== null) {
        return cookieValue;
      } else {
        return defaultValue;
      }
    },
    [searchParams, setSearchParams]
  );

  const setUrlParams = useCallback(
    (params: Array<{ key: UrlParamsTypes; value: string }>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      params.forEach(({ key, value }) => {
        newSearchParams.set(key, value);
      });
      setSearchParams(`?${newSearchParams.toString()}`);
    },
    [searchParams, setSearchParams]
  );

  const boundEast = parseFloat(
    getParam(UrlParamsTypes.boundEast, DEFAULT_MAP_BOUNDS.east.toString())!
  );
  const boundNorth = parseFloat(
    getParam(UrlParamsTypes.boundNorth, DEFAULT_MAP_BOUNDS.north.toString())!
  );
  const boundSouth = parseFloat(
    getParam(UrlParamsTypes.boundSouth, DEFAULT_MAP_BOUNDS.south.toString())!
  );
  const boundWest = parseFloat(
    getParam(UrlParamsTypes.boundWest, DEFAULT_MAP_BOUNDS.west.toString())!
  );
  const currentCenter = useMemo(
    () =>
      JSON.parse(
        getParam(
          UrlParamsTypes.currentCenter,
          JSON.stringify(DEFAULT_MAP_CENTER)
        )!
      ),
    [searchParams]
  );
  const currentUserSettings = getParam(
    UrlParamsTypes.currentUserSettings,
    UserSettings.MapView
  ) as UserSettings;
  const currentZoom = parseFloat(
    getParam(UrlParamsTypes.currentZoom, DEFAULT_ZOOM.toString())!
  );

  const isIndoor = getParam(UrlParamsTypes.isIndoor, FALSE);
  const currentYear = new Date().getFullYear();

  const gridSize = parseInt(
    getParam(UrlParamsTypes.gridSize, defaultGridSize.toString())!
  );
  const limit = parseInt(getParam(UrlParamsTypes.limit, "100")!);
  const updateLimit = useCallback(
    (newLimit: number) => {
      setUrlParams([{ key: UrlParamsTypes.limit, value: newLimit.toString() }]);
    },
    [setUrlParams]
  );

  const mapTypeId =
    getParam(UrlParamsTypes.mapType, MAP_CONFIGS[0].mapTypeId) ||
    MAP_CONFIGS[0].mapTypeId;

  const measurementType = getParam(
    UrlParamsTypes.measurementType,
    ParameterTypes.PARTICULATE_MATTER
  )!;

  const offset = parseInt(getParam(UrlParamsTypes.offset, "0")!);
  const updateOffset = useCallback(
    (newOffset: number) => {
      setUrlParams([
        { key: UrlParamsTypes.offset, value: newOffset.toString() },
      ]);
    },
    [setUrlParams]
  );

  const fetchedSessions = parseInt(
    getParam(UrlParamsTypes.fetchedSessions, "0")!
  );
  const updateFetchedSessions = useCallback(
    (newFetchedSessions: number) => {
      setUrlParams([
        {
          key: UrlParamsTypes.fetchedSessions,
          value: newFetchedSessions.toString(),
        },
      ]);
    },
    [setUrlParams]
  );
  const previousCenter = useMemo(
    () =>
      JSON.parse(
        getParam(
          UrlParamsTypes.previousCenter,
          JSON.stringify(DEFAULT_MAP_CENTER)
        )!
      ),
    [searchParams]
  );
  const previousUserSettings = getParam(
    UrlParamsTypes.previousUserSettings,
    UserSettings.MapView
  ) as UserSettings;

  const updatePreviousUserSettings = useCallback(
    (selectedPreviousUserSettings: UserSettings) => {
      setUrlParams([
        {
          key: UrlParamsTypes.previousUserSettings,
          value: selectedPreviousUserSettings,
        },
      ]);
    },
    [setUrlParams]
  );
  const previousZoom = parseFloat(
    getParam(UrlParamsTypes.previousZoom, DEFAULT_ZOOM.toString())!
  );
  const sensorName = getParam(
    UrlParamsTypes.sensorName,
    SENSOR_NAMES.PARTICULATE_MATTER.GOVERNMENT_PM25
  )!;
  const sessionId =
    getParam(UrlParamsTypes.sessionId, null) !== null
      ? parseInt(getParam(UrlParamsTypes.sessionId, "0")!)
      : null;
  const sessionType = useMemo(
    () =>
      getParam(UrlParamsTypes.sessionType, SessionTypes.FIXED) as SessionType,
    [searchParams]
  );
  const updateSessionType = useCallback(
    (selectedSessionType: SessionType) => {
      setUrlParams([
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
    [currentUserSettings, setUrlParams]
  );

  const isActive = useMemo(() => {
    const activeParam = getParam(UrlParamsTypes.isActive, TRUE);

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
      setUrlParams([
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
    [sessionType, setUrlParams, currentYear]
  );

  const streamId =
    getParam(UrlParamsTypes.streamId, null) !== null
      ? parseInt(getParam(UrlParamsTypes.streamId, "0")!)
      : null;
  const tags = getParam(UrlParamsTypes.tags, "");
  const initialThresholds = useMemo(
    () => ({
      min: parseFloat(
        getParam(UrlParamsTypes.thresholdMin, defaultThresholds.min.toString())!
      ),
      low: parseFloat(
        getParam(UrlParamsTypes.thresholdLow, defaultThresholds.low.toString())!
      ),
      middle: parseFloat(
        getParam(
          UrlParamsTypes.thresholdMiddle,
          defaultThresholds.middle.toString()
        )!
      ),
      high: parseFloat(
        getParam(
          UrlParamsTypes.thresholdHigh,
          defaultThresholds.high.toString()
        )!
      ),
      max: parseFloat(
        getParam(UrlParamsTypes.thresholdMax, defaultThresholds.max.toString())!
      ),
    }),
    [defaultThresholds]
  );
  const timeFrom = getParam(
    UrlParamsTypes.timeFrom,
    beginningOfTheYear(getLastFiveYears()[0]).toString()
  )!;
  const timeTo = getParam(
    UrlParamsTypes.timeTo,
    endOfTheYear(getLastFiveYears()[0]).toString()
  )!;
  const unitSymbol = getParam(
    UrlParamsTypes.unitSymbol,
    UnitSymbols.ParticulateMatter
  )!;
  const usernames = getParam(UrlParamsTypes.usernames, "");

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
  }, [thresholdValues]);

  const goToUserSettings = useCallback(
    (newUserSettings: UserSettings) => {
      setUrlParams([
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

    setUrlParams([
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
  }, [searchParams, previousUserSettings, currentUserSettings, setUrlParams]);

  const setFilter = useCallback(
    (key: UrlParamsTypes, value: string) => {
      if (isMobile) {
        setUrlParams([
          {
            key: key,
            value: value,
          },
        ]);
      } else {
        setUrlParams([
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
        setUrlParams([
          {
            key: UrlParamsTypes.isIndoor,
            value: isIndoor,
          },
          { key: UrlParamsTypes.usernames, value: "" },
        ]);
      } else {
        setUrlParams([
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
      setUrlParams([
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
    [beginningOfTheYear, currentUserSettings, endOfTheYear, setUrlParams]
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

      setUrlParams(commonParams);

      if (
        isIndoor === TRUE &&
        sensorData.sensorName.startsWith(SensorPrefix.GOVERNMENT)
      ) {
        setUrlParams([
          ...commonParams,
          {
            key: UrlParamsTypes.isIndoor,
            value: FALSE,
          },
        ]);
      }
    },
    [setUrlParams, setSensor]
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

      setUrlParams(commonParams);

      if (
        isIndoor === TRUE &&
        selectedSensor.startsWith(SensorPrefix.GOVERNMENT)
      ) {
        setUrlParams([
          ...commonParams,
          {
            key: UrlParamsTypes.isIndoor,
            value: FALSE,
          },
        ]);
      }
    },
    [setUrlParams, getSensorUnitSymbol]
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
    setUrlParams,
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

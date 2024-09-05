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
import { setFetchingData } from "../store/mapSlice";
import {
  setBasicParametersModalOpen,
  setBasicSensorsModalOpen,
} from "../store/sessionFiltersSlice";
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
  isActive = "isActive",
}

export const useMapParams = () => {
  const defaultThresholds = useAppSelector(selectDefaultThresholds);
  const thresholdValues = useAppSelector(selectThresholds);
  const isMobile: boolean = useMobileDetection();
  const [searchParams, setSearchParams] = useSearchParams();

  const getSearchParam = (
    param: UrlParamsTypes,
    defaultValue: string | null
  ): string | null => searchParams.get(param) ?? defaultValue;

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
    getSearchParam(
      UrlParamsTypes.boundEast,
      DEFAULT_MAP_BOUNDS.east.toString()
    )!
  );
  const boundNorth = parseFloat(
    getSearchParam(
      UrlParamsTypes.boundNorth,
      DEFAULT_MAP_BOUNDS.north.toString()
    )!
  );
  const boundSouth = parseFloat(
    getSearchParam(
      UrlParamsTypes.boundSouth,
      DEFAULT_MAP_BOUNDS.south.toString()
    )!
  );
  const boundWest = parseFloat(
    getSearchParam(
      UrlParamsTypes.boundWest,
      DEFAULT_MAP_BOUNDS.west.toString()
    )!
  );
  const currentCenter = useMemo(
    () =>
      JSON.parse(
        getSearchParam(
          UrlParamsTypes.currentCenter,
          JSON.stringify(DEFAULT_MAP_CENTER)
        )!
      ),
    [searchParams]
  );
  const currentUserSettings = getSearchParam(
    UrlParamsTypes.currentUserSettings,
    UserSettings.MapView
  ) as UserSettings;
  const currentZoom = parseFloat(
    getSearchParam(UrlParamsTypes.currentZoom, DEFAULT_ZOOM.toString())!
  );

  const gridSize = parseInt(
    getSearchParam(UrlParamsTypes.gridSize, defaultGridSize.toString())!
  );
  const limit = parseInt(getSearchParam(UrlParamsTypes.limit, "100")!);
  const updateLimit = useCallback(
    (newLimit: number) => {
      setUrlParams([{ key: UrlParamsTypes.limit, value: newLimit.toString() }]);
    },
    [setUrlParams]
  );

  const mapTypeId =
    getSearchParam(UrlParamsTypes.mapType, MAP_CONFIGS[0].mapTypeId) ||
    MAP_CONFIGS[0].mapTypeId;

  const measurementType = getSearchParam(
    UrlParamsTypes.measurementType,
    ParameterTypes.PARTICULATE_MATTER
  )!;

  const offset = parseInt(getSearchParam(UrlParamsTypes.offset, "0")!);
  const updateOffset = useCallback(
    (newOffset: number) => {
      setUrlParams([
        { key: UrlParamsTypes.offset, value: newOffset.toString() },
      ]);
    },
    [setUrlParams]
  );

  const fetchedSessions = parseInt(
    getSearchParam(UrlParamsTypes.fetchedSessions, "0")!
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
        getSearchParam(
          UrlParamsTypes.previousCenter,
          JSON.stringify(DEFAULT_MAP_CENTER)
        )!
      ),
    [searchParams]
  );
  const previousUserSettings = getSearchParam(
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
    getSearchParam(UrlParamsTypes.previousZoom, DEFAULT_ZOOM.toString())!
  );
  const sensorName = getSearchParam(
    UrlParamsTypes.sensorName,
    SENSOR_NAMES.PARTICULATE_MATTER.GOVERNMENT_PM25
  )!;
  const sessionId =
    getSearchParam(UrlParamsTypes.sessionId, null) !== null
      ? parseInt(getSearchParam(UrlParamsTypes.sessionId, "0")!)
      : null;
  const sessionType = useMemo(
    () =>
      getSearchParam(
        UrlParamsTypes.sessionType,
        SessionTypes.FIXED
      ) as SessionType,
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
        {
          key: UrlParamsTypes.timeFrom,
          value: beginningOfTheYear(getLastFiveYears()[0]).toString(),
        },
        {
          key: UrlParamsTypes.timeTo,
          value: endOfTheYear(getLastFiveYears()[0]).toString(),
        },
        {
          key: UrlParamsTypes.isActive,
          value: FALSE,
        },
      ]);
    },
    [currentUserSettings, setUrlParams]
  );
  const streamId =
    getSearchParam(UrlParamsTypes.streamId, null) !== null
      ? parseInt(getSearchParam(UrlParamsTypes.streamId, "0")!)
      : null;
  const tags = getSearchParam(UrlParamsTypes.tags, "");
  const isIndoor = getSearchParam(UrlParamsTypes.isIndoor, FALSE);
  const isActive = getSearchParam(UrlParamsTypes.isActive, TRUE);

  const initialThresholds = useMemo(
    () => ({
      min: parseFloat(
        getSearchParam(
          UrlParamsTypes.thresholdMin,
          defaultThresholds.min.toString()
        )!
      ),
      low: parseFloat(
        getSearchParam(
          UrlParamsTypes.thresholdLow,
          defaultThresholds.low.toString()
        )!
      ),
      middle: parseFloat(
        getSearchParam(
          UrlParamsTypes.thresholdMiddle,
          defaultThresholds.middle.toString()
        )!
      ),
      high: parseFloat(
        getSearchParam(
          UrlParamsTypes.thresholdHigh,
          defaultThresholds.high.toString()
        )!
      ),
      max: parseFloat(
        getSearchParam(
          UrlParamsTypes.thresholdMax,
          defaultThresholds.max.toString()
        )!
      ),
    }),
    [defaultThresholds]
  );
  const timeFrom = getSearchParam(
    UrlParamsTypes.timeFrom,
    beginningOfTheYear(getLastFiveYears()[0]).toString()
  )!;
  const timeTo = getSearchParam(
    UrlParamsTypes.timeTo,
    endOfTheYear(getLastFiveYears()[0]).toString()
  )!;
  const unitSymbol = getSearchParam(
    UrlParamsTypes.unitSymbol,
    UnitSymbols.ParticulateMatter
  )!;
  const usernames = getSearchParam(UrlParamsTypes.usernames, "");

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

  const updateMeasurementType = useCallback(
    (selectedMeasurementType: ParameterType, sensors: Sensor[]) => {
      const selectedSensor = setSensor(
        selectedMeasurementType,
        sensors,
        sessionType
      );
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
          key: UrlParamsTypes.measurementType,
          value: selectedMeasurementType,
        },
        {
          key: UrlParamsTypes.sensorName,
          value: selectedSensor.sensorName,
        },
        {
          key: UrlParamsTypes.unitSymbol,
          value: selectedSensor.unitSymbol,
        },
      ]);
    },
    [currentUserSettings, sessionType, setSensor, setUrlParams, isMobile]
  );

  const updateSensorName = useCallback(
    (selectedSensorName: string, sensors: Sensor[]) => {
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
          key: UrlParamsTypes.sensorName,
          value: selectedSensorName,
        },
        {
          key: UrlParamsTypes.unitSymbol,
          value: getSensorUnitSymbol(selectedSensorName, sensors),
        },
        {
          key: UrlParamsTypes.isIndoor,
          value: FALSE,
        },
      ]);
    },
    [currentUserSettings, setUrlParams]
  );

  const updateTime = useCallback(
    (selectedYear: number) => {
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

  const updateActiveFixedSessions = useCallback(
    (currentYear: number) => {
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
        {
          key: UrlParamsTypes.isActive,
          value: TRUE,
        },
      ]);
    },
    [setUrlParams, currentUserSettings, isMobile]
  );

  const debouncedUpdateURL = useCallback(
    debounce((params) => {
      setSearchParams(params);
    }, 300),
    [setSearchParams]
  );

  const setParameterParams = useCallback(
    (
      selectedParameter: ParameterType,
      sensors: Sensor[],
      dispatch: (action: any) => void
    ) => {
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
        {
          key: UrlParamsTypes.currentZoom,
          value: UrlParamsTypes.previousZoom,
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
            value: "false",
          },
        ]);
      }

      dispatch(setBasicParametersModalOpen(false));
      dispatch(setFetchingData(true));
    },
    [setUrlParams, setSensor, setBasicParametersModalOpen, setFetchingData]
  );

  const setSensorParams = useCallback(
    (
      selectedSensor: string,
      sensors: Sensor[],
      dispatch: (action: any) => void
    ) => {
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
          key: UrlParamsTypes.sensorName,
          value: selectedSensor,
        },
        {
          key: UrlParamsTypes.unitSymbol,
          value: getSensorUnitSymbol(selectedSensor, sensors),
        },
        {
          key: UrlParamsTypes.currentZoom,
          value: UrlParamsTypes.previousZoom,
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
            value: "false",
          },
        ]);
      }

      dispatch(setBasicSensorsModalOpen(false));
      dispatch(setFetchingData(true));
    },
    [
      setUrlParams,
      getSensorUnitSymbol,
      setBasicSensorsModalOpen,
      setFetchingData,
    ]
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
    isIndoor,
    limit,
    mapTypeId,
    measurementType,
    updateMeasurementType,
    offset,
    previousCenter,
    previousUserSettings,
    updatePreviousUserSettings,
    previousZoom,
    revertUserSettingsAndResetIds,
    sensorName,
    updateSensorName,
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
    updateIndoorFilters,
    usernames,
    isActive,
    updateActiveFixedSessions,
    setParameterParams,
    setSensorParams,
  };
};

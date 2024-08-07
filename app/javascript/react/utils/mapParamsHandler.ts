import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { MAP_CONFIGS } from "../components/Map/mapConfigs";
import {
  DEFAULT_MAP_BOUNDS,
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
} from "../const/coordinates";
import { useAppSelector } from "../store/hooks";
import { selectDefaultThresholds } from "../store/thresholdSlice";
import {
  FixedBasicParameterTypes,
  SessionType,
  SessionTypes,
} from "../types/filters";
import { Thresholds } from "../types/thresholds";
import { UserSettings } from "../types/userStates";
import useMobileDetection from "../utils/useScreenSizeDetection";

export enum UrlParamsTypes {
  boundEast = "boundEast",
  boundNorth = "boundNorth",
  boundSouth = "boundSouth",
  boundWest = "boundWest",
  currentCenter = "currentCenter",
  currentUserSettings = "currentUserSettings",
  currentZoom = "currentZoom",
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
}

export const useMapParams = () => {
  const defaultThresholds = useAppSelector(selectDefaultThresholds);
  const isMobile = useMobileDetection();
  const [searchParams, setSearchParams] = useSearchParams();

  const getSearchParam = useCallback(
    (param: UrlParamsTypes, defaultValue: string | null): string | null =>
      searchParams.get(param) ?? defaultValue,
    [searchParams]
  );

  const setUrlParams = useCallback(
    (params: Array<{ key: UrlParamsTypes; value: string }>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      params.forEach(({ key, value }) => {
        newSearchParams.set(key, value);
      });
      setSearchParams(newSearchParams); // Directly pass the new search params object
    },
    [searchParams, setSearchParams]
  );

  const boundEast = useMemo(
    () =>
      parseFloat(
        getSearchParam(
          UrlParamsTypes.boundEast,
          DEFAULT_MAP_BOUNDS.east.toString()
        )!
      ),
    [getSearchParam]
  );
  const boundNorth = useMemo(
    () =>
      parseFloat(
        getSearchParam(
          UrlParamsTypes.boundNorth,
          DEFAULT_MAP_BOUNDS.north.toString()
        )!
      ),
    [getSearchParam]
  );
  const boundSouth = useMemo(
    () =>
      parseFloat(
        getSearchParam(
          UrlParamsTypes.boundSouth,
          DEFAULT_MAP_BOUNDS.south.toString()
        )!
      ),
    [getSearchParam]
  );
  const boundWest = useMemo(
    () =>
      parseFloat(
        getSearchParam(
          UrlParamsTypes.boundWest,
          DEFAULT_MAP_BOUNDS.west.toString()
        )!
      ),
    [getSearchParam]
  );
  const currentCenter = useMemo(
    () =>
      JSON.parse(
        getSearchParam(
          UrlParamsTypes.currentCenter,
          JSON.stringify(DEFAULT_MAP_CENTER)
        )!
      ),
    [getSearchParam]
  );
  const currentUserSettings = useMemo(
    () =>
      getSearchParam(
        UrlParamsTypes.currentUserSettings,
        UserSettings.MapView
      ) as UserSettings,
    [getSearchParam]
  );
  const currentZoom = useMemo(
    () =>
      parseFloat(
        getSearchParam(UrlParamsTypes.currentZoom, DEFAULT_ZOOM.toString())!
      ),
    [getSearchParam]
  );
  const initialLimit = useMemo(
    () => parseInt(getSearchParam(UrlParamsTypes.limit, "100")!),
    [getSearchParam]
  );
  const mapTypeId = useMemo(
    () =>
      getSearchParam(UrlParamsTypes.mapType, MAP_CONFIGS[0].mapTypeId) ||
      MAP_CONFIGS[0].mapTypeId,
    [getSearchParam]
  );
  const measurementType = useMemo(
    () =>
      getSearchParam(
        UrlParamsTypes.measurementType,
        FixedBasicParameterTypes.PARTICULATE_MATTER
      )!,
    [getSearchParam]
  );
  const initialOffset = useMemo(
    () => parseInt(getSearchParam(UrlParamsTypes.offset, "0")!),
    [getSearchParam]
  );
  const previousCenter = useMemo(
    () =>
      JSON.parse(
        getSearchParam(
          UrlParamsTypes.previousCenter,
          JSON.stringify(DEFAULT_MAP_CENTER)
        )!
      ),
    [getSearchParam]
  );
  const previousUserSettings = useMemo(
    () =>
      getSearchParam(
        UrlParamsTypes.previousUserSettings,
        UserSettings.MapView
      ) as UserSettings,
    [getSearchParam]
  );
  const previousZoom = useMemo(
    () =>
      parseFloat(
        getSearchParam(UrlParamsTypes.previousZoom, DEFAULT_ZOOM.toString())!
      ),
    [getSearchParam]
  );
  const sensorName = useMemo(
    () => getSearchParam(UrlParamsTypes.sensorName, "Government-PM2.5")!,
    [getSearchParam]
  );
  const sessionId = useMemo(
    () =>
      getSearchParam(UrlParamsTypes.sessionId, null) !== null
        ? parseInt(getSearchParam(UrlParamsTypes.sessionId, "0")!)
        : null,
    [getSearchParam]
  );
  const sessionType = useMemo(
    () =>
      getSearchParam(
        UrlParamsTypes.sessionType,
        SessionTypes.FIXED
      ) as SessionType,
    [getSearchParam]
  );
  const streamId = useMemo(
    () =>
      getSearchParam(UrlParamsTypes.streamId, null) !== null
        ? parseInt(getSearchParam(UrlParamsTypes.streamId, "0")!)
        : null,
    [getSearchParam]
  );

  const thresholds = useMemo(
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
    [getSearchParam, defaultThresholds]
  );
  const initialUnitSymbol = useMemo(
    () => getSearchParam(UrlParamsTypes.unitSymbol, "µg/m³")!,
    [getSearchParam]
  );

  const usernames = useMemo(
    () => getSearchParam(UrlParamsTypes.usernames, ""),
    [getSearchParam]
  );
  const tags = useMemo(
    () => getSearchParam(UrlParamsTypes.tags, ""),
    [getSearchParam]
  );

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
    [currentUserSettings, setUrlParams]
  );

  const revertUserSettingsAndResetIds = useCallback(() => {
    setUrlParams([
      { key: UrlParamsTypes.sessionId, value: "" },
      { key: UrlParamsTypes.streamId, value: "" },
      {
        key: UrlParamsTypes.previousUserSettings,
        value: currentUserSettings,
      },
      {
        key: UrlParamsTypes.currentUserSettings,
        value: previousUserSettings,
      },
    ]);
  }, [currentUserSettings, previousUserSettings, setUrlParams]);

  const setFilters = useCallback(
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
            value: UserSettings.MapView,
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
    [currentUserSettings, isMobile, setUrlParams]
  );

  const setThresholds = useCallback(
    (thresholds: Thresholds) => {
      setUrlParams([
        {
          key: UrlParamsTypes.thresholdMin,
          value: thresholds.min.toString(),
        },
        {
          key: UrlParamsTypes.thresholdLow,
          value: thresholds.low.toString(),
        },
        {
          key: UrlParamsTypes.thresholdMiddle,
          value: thresholds.middle.toString(),
        },
        {
          key: UrlParamsTypes.thresholdHigh,
          value: thresholds.high.toString(),
        },
        {
          key: UrlParamsTypes.thresholdMax,
          value: thresholds.max.toString(),
        },
      ]);
    },
    [setUrlParams]
  );

  return {
    boundEast,
    boundNorth,
    boundSouth,
    boundWest,
    currentCenter,
    currentUserSettings,
    currentZoom,
    goToUserSettings,
    initialLimit,
    mapTypeId,
    measurementType,
    initialOffset,
    previousCenter,
    previousUserSettings,
    previousZoom,
    revertUserSettingsAndResetIds,
    sensorName,
    sessionId,
    sessionType,
    setFilters,
    setThresholds,
    setUrlParams,
    streamId,
    initialUnitSymbol,
    searchParams,
    usernames,
    tags,
    thresholds,
  };
};

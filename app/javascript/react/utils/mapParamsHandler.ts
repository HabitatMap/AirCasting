import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { MAP_CONFIGS } from "../components/Map/mapConfigs";
import {
  DEFAULT_MAP_BOUNDS,
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
} from "../const/coordinates";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  selectDefaultThresholds,
  selectThresholds,
} from "../store/thresholdSlice";
import { SessionType, SessionTypes } from "../types/filters";
import { UserSettings } from "../types/userStates";

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
}

export const useMapParams = () => {
  const dispatch = useAppDispatch();
  const defaultThresholds = useAppSelector(selectDefaultThresholds);
  const thresholdValues = useAppSelector(selectThresholds);
  const navigate = useNavigate();
  const isFirstRender = useRef(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const getSearchParam = (param: UrlParamsTypes, defaultValue: string | null) =>
    searchParams.get(param) ?? defaultValue;

  const setUrlParams = useCallback(
    (params: Array<{ key: UrlParamsTypes; value: string }>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      params.forEach(({ key, value }) => {
        newSearchParams.set(key, value);
      });
      setSearchParams(`?${newSearchParams.toString()}`);
    },
    [searchParams, navigate]
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
  const initialLimit = parseInt(getSearchParam(UrlParamsTypes.limit, "100")!);
  const mapTypeId =
    getSearchParam(UrlParamsTypes.mapType, MAP_CONFIGS[0].mapTypeId) ||
    MAP_CONFIGS[0].mapTypeId;
  const initialMeasurementType = getSearchParam(
    UrlParamsTypes.measurementType,
    "Particulate Matter"
  )!;
  const initialOffset = parseInt(getSearchParam(UrlParamsTypes.offset, "0")!);
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
  const previousZoom = parseFloat(
    getSearchParam(UrlParamsTypes.previousZoom, DEFAULT_ZOOM.toString())!
  );
  const initialSensorName = getSearchParam(
    UrlParamsTypes.sensorName,
    "Government-PM2.5"
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
  const streamId =
    getSearchParam(UrlParamsTypes.streamId, null) !== null
      ? parseInt(getSearchParam(UrlParamsTypes.streamId, "0")!)
      : null;
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
  const initialUnitSymbol = getSearchParam(UrlParamsTypes.unitSymbol, "µg/m³")!;

  useEffect(() => {
    const queryParams = new URLSearchParams(searchParams.toString());
    // temporary solution -> later we'll move thresholds to URL
    thresholdValues.min !== 0 &&
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

  const debouncedUpdateURL = useCallback(
    debounce((params) => {
      console.log("params", params.toString());
      setSearchParams(params);
    }, 300),
    [setSearchParams]
  );

  return {
    boundEast,
    boundNorth,
    boundSouth,
    boundWest,
    currentCenter,
    currentUserSettings,
    currentZoom,
    debouncedUpdateURL,
    getSearchParam,
    initialLimit,
    mapTypeId,
    initialMeasurementType,
    initialOffset,
    previousCenter,
    previousUserSettings,
    previousZoom,
    initialSensorName,
    sessionId,
    sessionType,
    setUrlParams,
    streamId,
    initialThresholds,
    initialUnitSymbol,
    searchParams,
  };
};

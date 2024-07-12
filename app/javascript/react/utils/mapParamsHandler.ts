import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { MAP_CONFIGS, MAP_ID } from "../components/Map/mapConfigs";
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from "../const/coordinates";
import { useAppDispatch } from "../store/hooks";
import { initializeStateFromUrl } from "../store/mapSlice";
import {
  selectDefaultThresholds,
  setUserThresholdValues,
} from "../store/thresholdSlice";
import { initializeUserSettings } from "../store/userSettingsSlice";
import { SessionType, SessionTypes } from "../types/filters";
import { UserSettings } from "../types/userStates";

export const useMapParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const getSearchParam = (param: string, defaultValue: string | null) =>
    searchParams.get(param) ?? defaultValue;

  const defaultThresholds = useSelector(selectDefaultThresholds);
  const dispatch = useAppDispatch();
  const isFirstRender = useRef(true);

  const initialCenter = useMemo(
    () =>
      JSON.parse(getSearchParam("center", JSON.stringify(DEFAULT_MAP_CENTER))!),
    []
  );
  const initialZoom = parseInt(
    getSearchParam("zoom", DEFAULT_ZOOM.toString())!
  );
  const initialPreviousZoom = parseInt(
    getSearchParam("previousZoom", DEFAULT_ZOOM.toString())!
  );

  const initialCurrentUserSettings = getSearchParam(
    "currentUserSettings",
    UserSettings.MapView
  ) as UserSettings;
  const initialPreviousSettings = getSearchParam(
    "previousSettings",
    UserSettings.MapView
  ) as UserSettings;
  const initialSessionType = getSearchParam(
    "sessionType",
    SessionTypes.FIXED
  ) as SessionType;
  const initialSessionId =
    getSearchParam("sessionId", null) !== null
      ? parseInt(getSearchParam("sessionId", "0")!)
      : null;
  const initialStreamId =
    getSearchParam("streamId", null) !== null
      ? parseInt(getSearchParam("streamId", "0")!)
      : null;
  const initialHoverStreamId =
    getSearchParam("hoverStreamId", null) !== null
      ? parseInt(getSearchParam("hoverStreamId", "0")!)
      : null;
  const initialHoverPosition =
    getSearchParam("hoverPosition", null) !== null
      ? JSON.parse(
          getSearchParam("hoverPosition", JSON.stringify(DEFAULT_MAP_CENTER))!
        )
      : null;
  const initialMapTypeId =
    getSearchParam("mapType", MAP_CONFIGS[0].mapTypeId) ||
    MAP_CONFIGS[0].mapTypeId;
  const initialMapConfigId =
    getSearchParam("mapConfigId", MAP_CONFIGS[0].id) || MAP_CONFIGS[0].id;
  const initialLimit = parseInt(getSearchParam("limit", "100")!);
  const initialOffset = parseInt(getSearchParam("offset", "0")!);

  const initialMeasurementType = getSearchParam(
    "measurement_type",
    "Particulate Matter"
  )!;

  const initialSensorName = getSearchParam("sensor_name", "Government-PM2.5")!;
  const initialUnitSymbol = getSearchParam("unit_symbol", "µg/m³")!;
  const initialThresholds = useMemo(
    () => ({
      min: parseFloat(
        getSearchParam("thresholdMin", defaultThresholds.min.toString())!
      ),
      low: parseFloat(
        getSearchParam("thresholdLow", defaultThresholds.low.toString())!
      ),
      middle: parseFloat(
        getSearchParam("thresholdMiddle", defaultThresholds.middle.toString())!
      ),
      high: parseFloat(
        getSearchParam("thresholdHigh", defaultThresholds.high.toString())!
      ),
      max: parseFloat(
        getSearchParam("thresholdMax", defaultThresholds.max.toString())!
      ),
    }),
    [defaultThresholds]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      dispatch(
        initializeStateFromUrl({
          mapConfigId: initialMapConfigId,
          mapTypeId: initialMapTypeId,
          mapId: MAP_ID,
          location: initialCenter,
          loading: true,
          hoverStreamId: initialHoverStreamId,
          hoverPosition: initialHoverPosition,
          position: initialCenter,
          previousCenter: initialCenter,
          previousZoom: initialPreviousZoom,
        })
      );
      dispatch(setUserThresholdValues(initialThresholds));
      dispatch(
        initializeUserSettings({
          currentUserSettings: initialCurrentUserSettings,
          previousUserSettings: initialPreviousSettings,
        })
      );
      isFirstRender.current = false;
    }
  }, [
    dispatch,
    initialCenter,
    initialMapConfigId,
    initialMapTypeId,
    initialPreviousZoom,
    initialThresholds,
    initialCurrentUserSettings,
    initialPreviousSettings,
    initialHoverStreamId,
    initialHoverPosition,
  ]);

  const debouncedUpdateURL = useCallback(
    debounce((params) => {
      setSearchParams(params);
    }, 300),
    [setSearchParams]
  );

  return {
    initialCenter,
    initialZoom,
    initialPreviousZoom,
    initialSessionType,
    initialSessionId,
    initialStreamId,
    initialHoverStreamId,
    initialHoverPosition,
    initialMapTypeId,
    initialMapConfigId,
    initialPreviousSettings,
    initialCurrentUserSettings,
    initialLimit,
    initialOffset,
    initialMeasurementType,
    initialSensorName,
    initialUnitSymbol,
    initialThresholds,
    debouncedUpdateURL,
    getSearchParam,
    searchParams,
  };
};

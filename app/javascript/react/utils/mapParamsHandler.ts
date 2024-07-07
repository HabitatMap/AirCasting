// mapParamsUtils.ts
import { debounce } from "lodash";
import { useCallback, useEffect, useMemo } from "react";
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
import { SessionType, SessionTypes } from "../types/filters";

export const useMapParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const getSearchParam = (param: string, defaultValue: string | null) =>
    searchParams.get(param) ?? defaultValue;

  const defaultThresholds = useSelector(selectDefaultThresholds);
  const dispatch = useAppDispatch();

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
  const initialModalOpen = getSearchParam("modalOpen", "false") === "true";
  const initialMapTypeId = getSearchParam("mapType", "roadmap") || "roadmap";
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
    dispatch(
      initializeStateFromUrl({
        mapConfigId: MAP_CONFIGS[0].id,
        mapTypeId: initialMapTypeId,
        mapId: MAP_ID,
        location: initialCenter,
        loading: true,
        sessionsListOpen: false,
        hoverStreamId: null,
        position: initialCenter,
        modalOpen: initialModalOpen,
      })
    );
  }, [dispatch, initialCenter, initialMapTypeId, initialModalOpen]);

  useEffect(() => {
    dispatch(setUserThresholdValues(initialThresholds));
  }, [dispatch, initialThresholds]);

  const debouncedUpdateURL = useCallback(
    debounce((params) => {
      setSearchParams(params);
    }, 300),
    []
  );

  return {
    initialCenter,
    initialZoom,
    initialPreviousZoom,
    initialSessionType,
    initialSessionId,
    initialStreamId,
    initialModalOpen,
    initialMapTypeId,
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

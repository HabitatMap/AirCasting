import { Map as GoogleMap, MapEvent } from "@vis.gl/react-google-maps";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import pinImage from "../../assets/icons/pinImage.svg";
import {
  DEFAULT_MAP_BOUNDS,
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
  MIN_ZOOM,
} from "../../const/coordinates";
import { RootState } from "../../store";
import {
  selectFixedSessionPointsBySessionId,
  selectFixedSessionsList,
  selectFixedSessionsPoints,
  selectFixedSessionsStatusFulfilled,
} from "../../store/fixedSessionsSelectors";
import { fetchFixedSessions } from "../../store/fixedSessionsSlice";
import { fetchFixedStreamById } from "../../store/fixedStreamSlice";
import { useAppDispatch } from "../../store/hooks";
import {
  initializeStateFromUrl,
  selectModalOpen,
  setLoading,
  setMapTypeId,
  setModalOpen,
  setSessionsListOpen,
} from "../../store/mapSlice";
import {
  selectMobileSessionPointsBySessionId,
  selectMobileSessionsList,
  selectMobileSessionsPoints,
} from "../../store/mobileSessionsSelectors";
import { fetchMobileSessions } from "../../store/mobileSessionsSlice";
import { selectMobileStreamPoints } from "../../store/mobileStreamSelectors";
import { fetchMobileStreamById } from "../../store/mobileStreamSlice";
import {
  fetchThresholds,
  resetUserThresholds,
  selectDefaultThresholds,
  selectThresholds,
  setUserThresholdValues,
} from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { SessionList } from "../../types/sessionType";
import { pubSub } from "../../utils/pubSubManager";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { SessionDetailsModal } from "../Modals/SessionDetailsModal";
import { SectionButton } from "../SectionButton/SectionButton";
import { MobileSessionList } from "../SessionsListView/MobileSessionList/MobileSessionList";
import { SessionsListView } from "../SessionsListView/SessionsListView";
import { ThresholdsConfigurator } from "../ThresholdConfigurator/ThresholdConfigurator";
import * as S from "./Map.style";
import { FixedMarkers } from "./Markers/FixedMarkers";
import { MobileMarkers } from "./Markers/MobileMarkers";
import { StreamMarkers } from "./Markers/StreamMarkers";
import { MAP_CONFIGS, MAP_ID } from "./mapConfigs";

const Map = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const getSearchParam = (param: string, defaultValue: string | null) =>
    searchParams.get(param) ?? defaultValue;

  const defaultThresholds = useSelector(selectDefaultThresholds);

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

  // Hooks
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  // State
  const [mapBounds, setMapBounds] = useState({
    north: DEFAULT_MAP_BOUNDS.north,
    south: DEFAULT_MAP_BOUNDS.south,
    east: DEFAULT_MAP_BOUNDS.east,
    west: DEFAULT_MAP_BOUNDS.west,
  });
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [previousCenter, setPreviousCenter] = useState(initialCenter);
  const [previousZoom, setPreviousZoom] = useState(initialPreviousZoom);
  const [pulsatingSessionId, setPulsatingSessionId] = useState<number | null>(
    null
  );
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    initialSessionId
  );
  const [selectedSessionType, setSelectedSessionType] =
    useState<SessionType>(initialSessionType);
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(
    initialStreamId
  );
  const [modalOpenFromSessionsList, setModalOpenFromSessionsList] =
    useState(false);

  const fixedSessionTypeSelected: boolean =
    selectedSessionType === SessionTypes.FIXED;

  // Selectors
  const fixedSessionsStatusFulfilled = useSelector(
    selectFixedSessionsStatusFulfilled
  );
  const loading = useSelector((state: RootState) => state.map.loading);
  const mapId = useSelector((state: RootState) => state.map.mapId);
  const mapTypeId = useSelector((state: RootState) => state.map.mapTypeId);
  const mobileStreamPoints = useSelector(selectMobileStreamPoints);
  const fixedPoints = selectedSessionId
    ? useSelector(selectFixedSessionPointsBySessionId(selectedSessionId))
    : useSelector(selectFixedSessionsPoints);
  const mobilePoints = selectedSessionId
    ? useSelector(selectMobileSessionPointsBySessionId(selectedSessionId))
    : useSelector(selectMobileSessionsPoints);
  const modalOpen = useSelector(selectModalOpen);
  const thresholdValues = useSelector(selectThresholds);

  const sessionsPoints = fixedSessionTypeSelected ? fixedPoints : mobilePoints;

  const listSessions = useSelector(
    fixedSessionTypeSelected
      ? selectFixedSessionsList
      : selectMobileSessionsList
  );

  const sessionsListOpen = useSelector(
    (state: RootState) => state.map.sessionsListOpen
  );

  // Filters (temporary solution)
  const sensor_name = fixedSessionTypeSelected
    ? "Government-PM2.5"
    : "AirBeam-PM2.5";

  const filters = useMemo(
    () =>
      JSON.stringify({
        time_from: "1685318400",
        time_to: "1717027199",
        tags: "",
        usernames: "",
        west: mapBounds.west,
        east: mapBounds.east,
        south: mapBounds.south,
        north: mapBounds.north,
        limit: initialLimit,
        offset: initialOffset,
        sensor_name: sensor_name,
        measurement_type: initialMeasurementType,
        unit_symbol: initialUnitSymbol,
      }),
    [
      mapBounds,
      initialLimit,
      initialOffset,
      sensor_name,
      initialMeasurementType,
      initialUnitSymbol,
    ]
  );
  const unitSymbol = initialUnitSymbol.replace(/"/g, "");
  const encodedUnitSymbol = encodeURIComponent(unitSymbol);
  const thresholdFilters = `${sensor_name}?unit_symbol=${encodedUnitSymbol}`;

  // Effects
  useEffect(() => {
    if (loading) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedSessions({ filters }))
        : dispatch(fetchMobileSessions({ filters }));
      dispatch(setLoading(false));
    }
  }, [dispatch, filters, loading, fixedSessionTypeSelected]);

  useEffect(() => {
    dispatch(fetchThresholds(thresholdFilters));
  }, [dispatch, thresholdFilters]);

  useEffect(() => {
    if (selectedStreamId) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedStreamById(selectedStreamId))
        : dispatch(fetchMobileStreamById(selectedStreamId));
    }
  }, [dispatch, selectedStreamId, fixedSessionTypeSelected]);

  // Set initial map type ID and thresholds from URL
  useEffect(() => {
    dispatch(setMapTypeId(initialMapTypeId));
    dispatch(setUserThresholdValues(initialThresholds));
  }, [dispatch, initialMapTypeId, initialThresholds]);

  const debouncedUpdateURL = useCallback(
    debounce((params) => {
      setSearchParams(params);
    }, 300),
    []
  );

  // Update URL parameters
  useEffect(() => {
    const currentCenter = JSON.stringify(
      mapInstance?.getCenter()?.toJSON() || previousCenter
    );
    const currentZoom = (mapInstance?.getZoom() || previousZoom).toString();
    const queryParams = new URLSearchParams({
      center: currentCenter,
      zoom: currentZoom,
      previousZoom: previousZoom.toString(),
      sessionType: selectedSessionType,
      sessionId: selectedSessionId?.toString() || "",
      streamId: selectedStreamId?.toString() || "",
      modalOpen: modalOpen.toString(),
      mapType: mapTypeId,
      thresholdMin: thresholdValues.min?.toString() || "",
      thresholdLow: thresholdValues.low?.toString() || "",
      thresholdMiddle: thresholdValues.middle?.toString() || "",
      thresholdHigh: thresholdValues.high?.toString() || "",
      thresholdMax: thresholdValues.max?.toString() || "",
      limit: initialLimit.toString(),
      offset: initialOffset.toString(),
      sensor_name: initialSensorName,
      measurement_type: initialMeasurementType,
      unit_symbol: initialUnitSymbol,
    });
    const currentParams = searchParams.toString();
    if (queryParams.toString() !== currentParams) {
      debouncedUpdateURL(queryParams);
    }
  }, [
    mapInstance,
    previousCenter,
    previousZoom,
    selectedSessionType,
    selectedSessionId,
    selectedStreamId,
    modalOpen,
    mapTypeId,
    thresholdValues,
    initialLimit,
    initialOffset,
    initialSensorName,
    initialMeasurementType,
    initialUnitSymbol,
    searchParams,
    debouncedUpdateURL,
  ]);

  // Callbacks
  const onIdle = useCallback(
    (event: MapEvent) => {
      if (modalOpen) return;
      const map = event.map;
      if (!mapInstance) {
        setMapInstance(map);
        map.setOptions({
          clickableIcons: false,
        });
      }
      const bounds = map?.getBounds();
      if (!bounds) {
        return;
      }
      const north = bounds.getNorthEast().lat();
      const south = bounds.getSouthWest().lat();
      const east = bounds.getNorthEast().lng();
      const west = bounds.getSouthWest().lng();
      setMapBounds({ north, south, east, west });
    },
    [mapInstance, modalOpen]
  );

  // Handlers
  const handleMarkerClick = (
    streamId: number | null,
    id: number | null,
    selectedFromSessionsList?: boolean
  ) => {
    if (isMobile && fixedSessionTypeSelected) {
      navigate(`/fixed_stream?streamId=${streamId}`);
      return;
    }

    if (streamId) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedStreamById(streamId))
        : dispatch(fetchMobileStreamById(streamId));
    }

    if (selectedFromSessionsList && isMobile) {
      setModalOpenFromSessionsList(true);
    }

    if (!selectedStreamId) {
      setSelectedSessionId(id);
      setSelectedStreamId(streamId);
      dispatch(setModalOpen(false));
      setTimeout(() => {
        dispatch(setModalOpen(true));
      }, 0);

      if (mapInstance) {
        setPreviousZoom(mapInstance.getZoom() || DEFAULT_ZOOM);
        setPreviousCenter(
          mapInstance.getCenter()?.toJSON() || DEFAULT_MAP_CENTER
        );
      }
    }

    if (selectedStreamId) {
      dispatch(setModalOpen(false));
      setSelectedSessionId(null);
      setSelectedStreamId(null);

      if (mapInstance) {
        mapInstance.setZoom(previousZoom);
        mapInstance.setCenter(previousCenter);
      }
    }
  };

  const handleCloseModal = useCallback(() => {
    setSelectedStreamId(null);
    setSelectedSessionId(null);
    dispatch(setModalOpen(false));
    if (modalOpenFromSessionsList) {
      setTimeout(() => {
        dispatch(setSessionsListOpen(true));
      }, 0);
    }

    if (mapInstance) {
      mapInstance.setZoom(previousZoom);
      mapInstance.setCenter(previousCenter);
    }
  }, [
    dispatch,
    modalOpenFromSessionsList,
    mapInstance,
    previousZoom,
    previousCenter,
  ]);

  const handleClick = useCallback(
    (type: SessionType) => {
      setSelectedSessionType(type);
      dispatch(resetUserThresholds());
      dispatch(setLoading(true));
    },
    [dispatch]
  );

  return (
    <>
      {/* temporary solution, ticket: Session Filter: General filters */}
      <S.FixedButton onClick={() => handleClick(SessionTypes.FIXED)}>
        fixed - government-pm2.5
      </S.FixedButton>
      <S.MobileButton onClick={() => handleClick(SessionTypes.MOBILE)}>
        mobile - airbeam-pm2.5
      </S.MobileButton>
      {/* temporary solution, ticket: Session Filter: General filters */}
      <GoogleMap
        mapId={mapId}
        mapTypeId={mapTypeId}
        defaultCenter={initialCenter}
        defaultZoom={initialZoom}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        scaleControl={true}
        style={S.containerStyle}
        onIdle={onIdle}
        minZoom={MIN_ZOOM}
      >
        {fixedSessionsStatusFulfilled && fixedSessionTypeSelected && (
          <FixedMarkers
            sessions={sessionsPoints}
            onMarkerClick={handleMarkerClick}
            selectedStreamId={selectedStreamId}
            pulsatingSessionId={pulsatingSessionId}
          />
        )}
        {!fixedSessionTypeSelected && (
          <MobileMarkers
            sessions={sessionsPoints}
            onMarkerClick={handleMarkerClick}
            selectedStreamId={selectedStreamId}
            pulsatingSessionId={pulsatingSessionId}
          />
        )}
        {selectedStreamId && !fixedSessionTypeSelected && (
          <StreamMarkers
            sessions={mobileStreamPoints}
            unitSymbol={unitSymbol}
          />
        )}
      </GoogleMap>

      {
        // This is a temporary solution
        !isMobile && <ThresholdsConfigurator isMapPage={true} />
      }

      {modalOpen && (
        <SessionDetailsModal
          onClose={handleCloseModal}
          sessionType={selectedSessionType}
          streamId={selectedStreamId}
        />
      )}
      <S.MobileContainer>
        <SectionButton
          title={t("map.listSessions")}
          image={pinImage}
          alt={t("map.altListSessions")}
          onClick={() => {
            dispatch(setSessionsListOpen(true));
          }}
        />
        {sessionsListOpen && (
          <MobileSessionList
            sessions={listSessions.map((session: SessionList) => ({
              id: session.id,
              sessionName: session.title,
              sensorName: session.sensorName,
              averageValue: session.averageValue,
              startTime: session.startTime,
              endTime: session.endTime,
              streamId: session.streamId,
            }))}
            onCellClick={(id, streamId) => {
              if (!fixedSessionTypeSelected) {
                dispatch(setSessionsListOpen(false));
                pubSub.publish("CENTER_MAP", id);
              }
              handleMarkerClick(streamId, id, true);
            }}
            onClose={() => {
              dispatch(setSessionsListOpen(false));
              setModalOpenFromSessionsList(false);
            }}
          />
        )}
      </S.MobileContainer>
      {!modalOpen && (
        <S.DesktopContainer>
          <SessionsListView
            sessions={listSessions.map((session) => ({
              id: session.id,
              sessionName: session.title,
              sensorName: session.sensorName,
              averageValue: session.averageValue,
              startTime: session.startTime,
              endTime: session.endTime,
              streamId: session.streamId,
            }))}
            onCellClick={(id, streamId) => {
              setPulsatingSessionId(null);
              handleMarkerClick(streamId, id);
              pubSub.publish("CENTER_MAP", id);
            }}
            onCellMouseEnter={(id) => {
              setPulsatingSessionId(id);
            }}
            onCellMouseLeave={() => {
              setPulsatingSessionId(null);
            }}
          />
        </S.DesktopContainer>
      )}
    </>
  );
};

export { Map };

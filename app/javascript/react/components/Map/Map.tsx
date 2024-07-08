import { Map as GoogleMap, MapEvent } from "@vis.gl/react-google-maps";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  selectModalOpen,
  setLoading,
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
import { useMapParams } from "../../utils/mapParamsHandler";
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

const Map = () => {
  const {
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
    searchParams,
  } = useMapParams();

  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
  const defaultThresholds = useSelector(selectDefaultThresholds);

  const sessionsPoints = fixedSessionTypeSelected ? fixedPoints : mobilePoints;

  const listSessions = useSelector(
    fixedSessionTypeSelected
      ? selectFixedSessionsList
      : selectMobileSessionsList
  );

  const sessionsListOpen = useSelector(
    (state: RootState) => state.map.sessionsListOpen
  );

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

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (loading || isFirstRender.current) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedSessions({ filters }))
        : dispatch(fetchMobileSessions({ filters }));
      dispatch(setLoading(false));
    }
  }, [dispatch, filters, loading, fixedSessionTypeSelected]);

  useEffect(() => {
    dispatch(fetchThresholds(thresholdFilters));
    dispatch(setUserThresholdValues(initialThresholds));
  }, [dispatch, thresholdFilters, initialThresholds]);

  useEffect(() => {
    if (initialStreamId && initialModalOpen) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedStreamById(initialStreamId))
        : dispatch(fetchMobileStreamById(initialStreamId));
      dispatch(setModalOpen(true));
    }
  }, [dispatch, initialStreamId, initialModalOpen, fixedSessionTypeSelected]);

  useEffect(() => {
    if (isFirstRender.current && mapInstance) {
      mapInstance.setZoom(initialZoom);
      mapInstance.setCenter(initialCenter);
      setPreviousZoom(initialPreviousZoom); // Set previous zoom from URL params
      setPreviousCenter(initialCenter); // Set previous center from URL params
      isFirstRender.current = false;
    }
  }, [mapInstance, initialZoom, initialCenter, initialPreviousZoom]);
  useEffect(() => {
    if (!modalOpen) {
      // This checks if modalOpen has changed to false
      setSelectedStreamId(null);
      setSelectedSessionId(null);

      if (modalOpenFromSessionsList) {
        setTimeout(() => {
          dispatch(setSessionsListOpen(true));
        }, 0);
      }

      if (mapInstance) {
        mapInstance.setZoom(previousZoom);
        mapInstance.setCenter(previousCenter);
      }
    }
  }, [modalOpen]);

  useEffect(() => {
    if (!isFirstRender.current) {
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
        thresholdMin:
          thresholdValues.min?.toString() || defaultThresholds.min.toString(),
        thresholdLow:
          thresholdValues.low?.toString() || defaultThresholds.low.toString(),
        thresholdMiddle:
          thresholdValues.middle?.toString() ||
          defaultThresholds.middle.toString(),
        thresholdHigh:
          thresholdValues.high?.toString() || defaultThresholds.high.toString(),
        thresholdMax:
          thresholdValues.max?.toString() || defaultThresholds.max.toString(),
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
    defaultThresholds,
    initialLimit,
    initialOffset,
    initialSensorName,
    initialMeasurementType,
    initialUnitSymbol,
    searchParams,
    debouncedUpdateURL,
  ]);

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
  }, [modalOpenFromSessionsList, mapInstance, previousZoom, previousCenter]);

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
        {selectedStreamId && (
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

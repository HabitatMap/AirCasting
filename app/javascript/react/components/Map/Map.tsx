import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { Map as GoogleMap, MapEvent } from "@vis.gl/react-google-maps";

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
import { resetUserThresholds } from "../../store/thresholdSlice";
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

const Map = () => {
  // const
  const timeFrom = "1685318400";
  const timeTo = "1717027199";
  const tags = "";
  const usernames = "";
  const limit = 100;
  const offset = 0;
  const measurement_type = "Particulate Matter";
  const unit_symbol = "µg/m³";

  // Hooks
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();

  // State
  const [mapBounds, setMapBounds] = useState({
    north: DEFAULT_MAP_BOUNDS.north,
    south: DEFAULT_MAP_BOUNDS.south,
    east: DEFAULT_MAP_BOUNDS.east,
    west: DEFAULT_MAP_BOUNDS.west,
  });
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const [previousCenter, setPreviousCenter] = useState(DEFAULT_MAP_CENTER);
  const [previousZoom, setPreviousZoom] = useState(DEFAULT_ZOOM);
  const [pulsatingSessionId, setPulsatingSessionId] = useState<number | null>(
    null
  );
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>(
    SessionTypes.FIXED
  );
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
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
        time_from: timeFrom,
        time_to: timeTo,
        tags: tags,
        usernames: usernames,
        west: mapBounds.west,
        east: mapBounds.east,
        south: mapBounds.south,
        north: mapBounds.north,
        limit: limit,
        offset: offset,
        sensor_name: sensor_name,
        measurement_type: measurement_type,
        unit_symbol: unit_symbol,
      }),
    [
      timeFrom,
      timeTo,
      tags,
      usernames,
      mapBounds,
      limit,
      offset,
      sensor_name,
      measurement_type,
      unit_symbol,
    ]
  );
  const unitSymbol = unit_symbol.replace(/"/g, "");
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
    const urlParams = new URLSearchParams(location.search);
    const center = urlParams.get("center");
    const zoom = urlParams.get("zoom");
    const sessionType = urlParams.get("sessionType");
    const streamId = urlParams.get("streamId");
    const sessionId = urlParams.get("sessionId");
    const modal = urlParams.get("modal");

    const min = urlParams.get("min");
    const low = urlParams.get("low");
    const middle = urlParams.get("middle");
    const high = urlParams.get("high");
    const max = urlParams.get("max");

    if (center && zoom) {
      const [lat, lng] = center.split(",").map(Number);
      setPreviousCenter({ lat, lng });
      setPreviousZoom(Number(zoom));
      if (mapInstance) {
        mapInstance.setCenter({ lat, lng });
        mapInstance.setZoom(Number(zoom));
      }
    }

    if (sessionType) {
      setSelectedSessionType(sessionType as SessionType);
    }

    if (streamId) {
      setSelectedStreamId(Number(streamId));
      if (sessionType === SessionTypes.FIXED) {
        dispatch(fetchFixedStreamById(Number(streamId)));
      } else {
        dispatch(fetchMobileStreamById(Number(streamId)));
      }
    }

    if (sessionId) {
      setSelectedSessionId(Number(sessionId));
    }

    if (modal === "open") {
      setModalOpen(true);
    }

    if (min && low && middle && high && max) {
      dispatch(
        updateAll({
          min: Number(min),
          low: Number(low),
          middle: Number(middle),
          high: Number(high),
          max: Number(max),
        })
      );
    }
  }, [location.search, mapInstance, dispatch]);

  useEffect(() => {
    const urlParams = new URLSearchParams();
    urlParams.set("center", `${previousCenter.lat},${previousCenter.lng}`);
    urlParams.set("zoom", previousZoom.toString());
    urlParams.set("sessionType", selectedSessionType);
    if (selectedStreamId) {
      urlParams.set("streamId", selectedStreamId.toString());
    }
    if (selectedSessionId) {
      urlParams.set("sessionId", selectedSessionId.toString());
    }
    if (modalOpen) {
      urlParams.set("modal", "open");
    }
    urlParams.set("min", initialMin.toString());
    urlParams.set("low", initialLow.toString());
    urlParams.set("middle", initialMiddle.toString());
    urlParams.set("high", initialHigh.toString());
    urlParams.set("max", initialMax.toString());
    navigate(`${location.pathname}?${urlParams.toString()}`, { replace: true });
  }, [
    previousCenter,
    previousZoom,
    selectedSessionType,
    selectedStreamId,
    selectedSessionId,
    modalOpen,
    navigate,
    location.pathname,
    initialMin,
    initialLow,
    initialMiddle,
    initialHigh,
    initialMax,
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

  const handleCloseModal = () => {
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
  };

  const handleClick = (type: SessionType) => {
    setSelectedSessionType(type);
    dispatch(resetUserThresholds());
    dispatch(setLoading(true));
  };

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
        defaultCenter={DEFAULT_MAP_CENTER}
        defaultZoom={DEFAULT_ZOOM}
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
            unitSymbol={unit_symbol}
          />
        )}
      </GoogleMap>

      {
        //This is temprorary solution
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

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
  selectPreviousCenter,
  selectPreviousZoom,
  setLoading,
  setPreviousCenter,
  setPreviousZoom,
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
  resetUserThresholds,
  selectDefaultThresholds,
  selectThresholds,
} from "../../store/thresholdSlice";
import {
  selectUserSettingsState,
  updateUserSettings,
} from "../../store/userSettingsSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { SessionList } from "../../types/sessionType";
import { Thresholds } from "../../types/thresholds";
import { UserSettings } from "../../types/userStates";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const getSearchParam = (
    searchParams: URLSearchParams,
    param: string,
    defaultValue: string | null
  ): string | null => searchParams.get(param) ?? defaultValue;

  // Default values
  const defaultThresholds = useSelector(selectDefaultThresholds);

  // Adjusted calls to getSearchParam with proper typing
  const initialCenter = useMemo(
    () =>
      JSON.parse(
        getSearchParam(
          searchParams,
          "center",
          JSON.stringify(DEFAULT_MAP_CENTER)
        ) as string
      ),
    []
  );

  const initialZoom = parseInt(
    getSearchParam(searchParams, "zoom", DEFAULT_ZOOM.toString()) as string
  );

  const initialPreviousZoom = parseInt(
    getSearchParam(
      searchParams,
      "previousZoom",
      DEFAULT_ZOOM.toString()
    ) as string
  );

  const initialSessionType = getSearchParam(
    searchParams,
    "sessionType",
    SessionTypes.FIXED
  ) as string | (() => string);

  const initialSessionId =
    getSearchParam(searchParams, "sessionId", null) !== null
      ? parseInt(getSearchParam(searchParams, "sessionId", "0") as string)
      : null;

  const initialStreamId =
    getSearchParam(searchParams, "streamId", null) !== null
      ? parseInt(getSearchParam(searchParams, "streamId", "0") as string)
      : null;

  const initialModalOpen =
    getSearchParam(searchParams, "modalOpen", "false") === "true";

  const initialMapTypeId =
    getSearchParam(searchParams, "mapType", "roadmap") || "roadmap";

  const initialThresholds: Thresholds = useMemo(
    () => ({
      min: parseFloat(
        getSearchParam(
          searchParams,
          "thresholdMin",
          defaultThresholds.min.toString()
        ) as string
      ),
      low: parseFloat(
        getSearchParam(
          searchParams,
          "thresholdLow",
          defaultThresholds.low.toString()
        ) as string
      ),
      middle: parseFloat(
        getSearchParam(
          searchParams,
          "thresholdMiddle",
          defaultThresholds.middle.toString()
        ) as string
      ),
      high: parseFloat(
        getSearchParam(
          searchParams,
          "thresholdHigh",
          defaultThresholds.high.toString()
        ) as string
      ),
      max: parseFloat(
        getSearchParam(
          searchParams,
          "thresholdMax",
          defaultThresholds.max.toString()
        ) as string
      ),
    }),
    [defaultThresholds]
  );
  // Hooks
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State
  const [mapBounds, setMapBounds] = useState({
    north: DEFAULT_MAP_BOUNDS.north,
    south: DEFAULT_MAP_BOUNDS.south,
    east: DEFAULT_MAP_BOUNDS.east,
    west: DEFAULT_MAP_BOUNDS.west,
  });
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
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
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);

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
  const previousCenter = useSelector(selectPreviousCenter);
  const previousZoom = useSelector(selectPreviousZoom);
  const { previousUserSettings, currentUserSettings } = useSelector(
    selectUserSettingsState
  );

  const fixedPoints = selectedSessionId
    ? useSelector(selectFixedSessionPointsBySessionId(selectedSessionId))
    : useSelector(selectFixedSessionsPoints);
  const mobilePoints = selectedSessionId
    ? useSelector(selectMobileSessionPointsBySessionId(selectedSessionId))
    : useSelector(selectMobileSessionsPoints);
  const userThresholds = useSelector(selectThresholds);
  const thresholdsState = useSelector(selectThresholds);
  const [thresholdValues, setThresholdValues] = useState(thresholdsState);

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
        limit: 100,
        offset: 0,
        sensor_name: sensor_name,
        measurement_type: "Particulate Matter",
        unit_symbol: "µg/m³",
      }),
    [mapBounds, sensor_name]
  );
  const unitSymbol = "µg/m³".replace(/"/g, "");
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
  }, [filters, loading, fixedSessionTypeSelected]);

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
      fixedSessionTypeSelected
        ? dispatch(fetchFixedStreamById(selectedStreamId))
        : dispatch(fetchMobileStreamById(selectedStreamId));
    }
  }, [dispatch, selectedStreamId, fixedSessionTypeSelected]);

  // Set initial map type ID and thresholds from URL
  useEffect(() => {
    dispatch(setMapTypeId(initialMapTypeId));
    // dispatch(setUserThresholdValues(initialThresholds));
  }, [dispatch, initialMapTypeId]);

  const debouncedUpdateURL = useCallback(
    debounce((params) => {
      setSearchParams(params);
    }, 300), // 300ms debounce delay
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
      // thresholdMin: thresholdValues.min?.toString() || "",
      // thresholdLow: thresholdValues.low?.toString() || "",
      // thresholdMiddle: thresholdValues.middle?.toString() || "",
      // thresholdHigh: thresholdValues.high?.toString() || "",
      // thresholdMax: thresholdValues.max?.toString() || "",
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
    // thresholdValues,
    searchParams,
    debouncedUpdateURL,
  ]);

  useEffect(() => {
    if (currentUserSettings !== UserSettings.ModalView) {
      setSelectedStreamId(null);
      setSelectedSessionId(null);
    }
    setPreviousZoomOnTheMap();
    isMobile && setPreviousZoomInTheState();
  }, [currentUserSettings]);

  useEffect(() => {
    if (previousUserSettings === UserSettings.CalendarView) {
      const intervalId = setInterval(() => {
        setPreviousZoomOnTheMap();
        clearInterval(intervalId);
      }, 10);
      return () => clearInterval(intervalId);
    }
  }, [currentUserSettings, mapInstance]);

  // Callbacks
  const onIdle = useCallback(
    (event: MapEvent) => {
      if (currentUserSettings === UserSettings.MapView) {
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
      }
    },
    [mapInstance, currentUserSettings]
  );

  //Handlers;
  const handleMarkerClick = (streamId: number | null, id: number | null) => {
    if (currentUserSettings !== UserSettings.SessionListView) {
      setPreviousZoomInTheState();
    }

    if (streamId) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedStreamById(streamId))
        : dispatch(fetchMobileStreamById(streamId));
    }

    if (isMobile) {
      if (fixedSessionTypeSelected) {
        navigate(`/fixed_stream?streamId=${streamId}`);
        return;
      }
    }

    if (!selectedStreamId) {
      setSelectedSessionId(id);
      setSelectedStreamId(streamId);
      dispatch(updateUserSettings(UserSettings.ModalView));
    }

    if (selectedStreamId) {
      dispatch(updateUserSettings(previousUserSettings));
    }
  };

  const handleCloseModal = () => {
    setSelectedStreamId(null);
    setSelectedSessionId(null);
    dispatch(updateUserSettings(previousUserSettings));
  };

  const handleClick = (type: SessionType) => {
    setSelectedSessionType(type);
    dispatch(resetUserThresholds());
    dispatch(setLoading(true));
  };

  const setPreviousZoomOnTheMap = () => {
    if (currentUserSettings === UserSettings.MapView) {
      if (mapInstance) {
        mapInstance.setCenter(previousCenter);
        mapInstance.setZoom(previousZoom);
      }
    }
  };

  const setPreviousZoomInTheState = () => {
    const desktopCondition: boolean =
      !isMobile && currentUserSettings !== UserSettings.ModalView;
    const mobileCondition: boolean =
      isMobile && currentUserSettings === UserSettings.MapView;
    const mobileConditionForSessionList: boolean =
      isMobile &&
      currentUserSettings === UserSettings.SessionListView &&
      previousUserSettings === UserSettings.MapView;

    if (mapInstance) {
      if (
        desktopCondition ||
        mobileCondition ||
        mobileConditionForSessionList
      ) {
        const newZoom = mapInstance?.getZoom();
        const newCenter = mapInstance.getCenter()?.toJSON();
        if (newZoom !== previousZoom) {
          dispatch(setPreviousZoom(newZoom || DEFAULT_ZOOM));
        }
        if (newCenter !== previousCenter) {
          dispatch(setPreviousCenter(newCenter || DEFAULT_MAP_CENTER));
        }
      }
    }
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
        //This is temporary solution
        !isMobile && <ThresholdsConfigurator isMapPage={true} />
      }

      {currentUserSettings === UserSettings.ModalView && (
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
            dispatch(updateUserSettings(UserSettings.SessionListView));
          }}
        />
        {currentUserSettings === UserSettings.SessionListView && (
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
                pubSub.publish("CENTER_MAP", id);
              }
              handleMarkerClick(streamId, id);
            }}
            onClose={() => {
              dispatch(updateUserSettings(UserSettings.MapView));
            }}
          />
        )}
      </S.MobileContainer>
      {currentUserSettings === UserSettings.MapView && (
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

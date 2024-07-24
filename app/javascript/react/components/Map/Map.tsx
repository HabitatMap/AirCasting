import { Map as GoogleMap, MapEvent } from "@vis.gl/react-google-maps";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import filterIcon from "../../assets/icons/filterIcon.svg";
import mapLegend from "../../assets/icons/mapLegend.svg";
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
import { useAppDispatch, useAppSelector } from "../../store/hooks";
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
import { selectSelectedSessionType } from "../../store/sessionFiltersSlice";
import { fetchThresholds } from "../../store/thresholdSlice";
import {
  selectUserSettingsState,
  updateUserSettings,
} from "../../store/userSettingsSlice";
import { SessionTypes } from "../../types/filters";
import { SessionList } from "../../types/sessionType";
import { UserSettings } from "../../types/userStates";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { SessionDetailsModal } from "../Modals/SessionDetailsModal";
import { SectionButton } from "../SectionButton/SectionButton";
import { MobileSessionFilters } from "../SessionFilters/MobileSessionFilters";
import { MobileSessionList } from "../SessionsListView/MobileSessionList/MobileSessionList";
import { SessionsListView } from "../SessionsListView/SessionsListView";
import { ResetButtonVariant } from "../ThresholdConfigurator/ResetButton";
import { ThresholdsConfigurator } from "../ThresholdConfigurator/ThresholdConfigurator";
import { Legend } from "./Legend/Legend";
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
    null
  );
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);

  // Selectors
  const selectedSessionType = useAppSelector(selectSelectedSessionType);

  const fixedSessionTypeSelected: boolean =
    selectedSessionType === SessionTypes.FIXED;

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

  const sessionsPoints = fixedSessionTypeSelected ? fixedPoints : mobilePoints;

  const listSessions = useSelector(
    fixedSessionTypeSelected
      ? selectFixedSessionsList
      : selectMobileSessionsList
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
  }, [filters, loading, fixedSessionTypeSelected]);

  useEffect(() => {
    dispatch(fetchThresholds(thresholdFilters));
  }, [thresholdFilters]);

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

  // Handlers;
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

  const openLegend = () => {
    dispatch(updateUserSettings(UserSettings.MapLegendView));
  };

  const closeLegend = () => {
    dispatch(updateUserSettings(UserSettings.MapView));
  };

  const openFilters = () => {
    setPreviousZoomInTheState();
    fixedSessionTypeSelected
      ? dispatch(fetchFixedSessions({ filters }))
      : dispatch(fetchMobileSessions({ filters }));
    dispatch(updateUserSettings(UserSettings.FiltersView));
  };

  const closeFilters = () => {
    dispatch(updateUserSettings(UserSettings.MapView));
  };

  return (
    <>
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
      {/* Show ThresholdsConfigurator only on desktop, if it's mobile, it should only be shown when modal is open */}
      {(!isMobile ||
        (isMobile && currentUserSettings === UserSettings.ModalView)) && (
        <S.ThresholdContainer>
          <ThresholdsConfigurator
            resetButtonVariant={ResetButtonVariant.IconOnly}
            isMobileOldStyle={
              isMobile && currentUserSettings === UserSettings.ModalView
            }
          />
        </S.ThresholdContainer>
      )}

      {currentUserSettings === UserSettings.ModalView && (
        <SessionDetailsModal
          onClose={handleCloseModal}
          sessionType={selectedSessionType}
          streamId={selectedStreamId}
        />
      )}
      <S.MobileContainer>
        <S.MobileButtons>
          <SectionButton
            title={t("map.listSessions")}
            image={pinImage}
            alt={t("map.altListSessions")}
            onClick={() => {
              dispatch(updateUserSettings(UserSettings.SessionListView));
            }}
          />
          <SectionButton
            title={t("map.legendTile")}
            image={mapLegend}
            alt={t("map.altlegendTile")}
            onClick={openLegend}
          />
          <SectionButton
            title={t("filters.filters")}
            image={filterIcon}
            alt={t("filters.altFiltersIcon")}
            onClick={openFilters}
          />
        </S.MobileButtons>
        {currentUserSettings === UserSettings.MapLegendView && (
          <Legend onClose={closeLegend} />
        )}
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
              handleMarkerClick(streamId, id);
            }}
            onClose={() => {
              dispatch(updateUserSettings(UserSettings.MapView));
            }}
          />
        )}
        {currentUserSettings === UserSettings.FiltersView && (
          <MobileSessionFilters onClose={closeFilters} />
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

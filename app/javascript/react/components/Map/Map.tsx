import { Map as GoogleMap, MapEvent } from "@vis.gl/react-google-maps";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import filterIcon from "../../assets/icons/filterIcon.svg";
import mapLegend from "../../assets/icons/mapLegend.svg";
import pinImage from "../../assets/icons/pinImage.svg";
import { MIN_ZOOM } from "../../const/coordinates";
import { RootState } from "../../store";
import {
  selectFixedSessionPointsBySessionId,
  selectFixedSessionsList,
  selectFixedSessionsPoints,
  selectFixedSessionsStatusFulfilled,
} from "../../store/fixedSessionsSelectors";
import {
  cleanSessions,
  fetchFixedSessions,
} from "../../store/fixedSessionsSlice";
import { fetchFixedStreamById } from "../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
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
  setUserThresholdValues,
} from "../../store/thresholdSlice";
import { SessionTypes } from "../../types/filters";
import { SessionList } from "../../types/sessionType";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
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
import { CrowdMapMarkers } from "./Markers/CrowdMapMarkers";
import { FixedMarkers } from "./Markers/FixedMarkers";
import { MobileMarkers } from "./Markers/MobileMarkers";
import { StreamMarkers } from "./Markers/StreamMarkers";

const Map = () => {
  // Hooks
  const dispatch = useAppDispatch();
  const {
    boundEast,
    boundNorth,
    boundSouth,
    boundWest,
    currentCenter,
    currentUserSettings,
    currentZoom,
    debouncedUpdateURL,
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
    streamId,
    searchParams,
    tags,
    initialThresholds,
    unitSymbol,
    usernames,
  } = useMapParams();
  const isMobile = useMobileDetection();
  const navigate = useNavigate();
  const isFirstRender = useRef(true);
  const isFirstRenderForThresholds = useRef(true);
  const { t } = useTranslation();

  // State
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [pulsatingSessionId, setPulsatingSessionId] = useState<number | null>(
    null
  );

  // Selectors
  const defaultThresholds = useAppSelector(selectDefaultThresholds);
  const fixedPoints = sessionId
    ? useAppSelector(selectFixedSessionPointsBySessionId(sessionId))
    : useAppSelector(selectFixedSessionsPoints);
  const fixedSessionsStatusFulfilled = useAppSelector(
    selectFixedSessionsStatusFulfilled
  );
  const loading = useAppSelector((state: RootState) => state.map.loading);
  const mapId = useAppSelector((state: RootState) => state.map.mapId);
  const mobilePoints = sessionId
    ? useAppSelector(selectMobileSessionPointsBySessionId(sessionId))
    : useAppSelector(selectMobileSessionsPoints);
  const mobileStreamPoints = useAppSelector(selectMobileStreamPoints);
  const realtimeMapUpdates = useAppSelector(
    (state: RootState) => state.realtimeMapUpdates.realtimeMapUpdates
  );

  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;
  const listSessions = useAppSelector(
    fixedSessionTypeSelected
      ? selectFixedSessionsList
      : selectMobileSessionsList
  );
  const sessionsPoints = fixedSessionTypeSelected ? fixedPoints : mobilePoints;

  const newSearchParams = new URLSearchParams(searchParams.toString());
  const preparedUnitSymbol = unitSymbol.replace(/"/g, "");
  const encodedUnitSymbol = encodeURIComponent(preparedUnitSymbol);
  const sensorNamedDecoded = decodeURIComponent(sensorName);
  const tagsDecoded = tags && decodeURIComponent(tags);
  const usernamesDecoded = usernames && decodeURIComponent(usernames);

  const filters = useMemo(
    () =>
      // Change timeFrom and timeTo also in TagsInput
      JSON.stringify({
        time_from: "1685318400",
        time_to: "1717027199",
        tags: tagsDecoded,
        usernames: usernamesDecoded,
        west: boundWest,
        east: boundEast,
        south: boundSouth,
        north: boundNorth,
        limit: initialLimit,
        offset: initialOffset,
        sensor_name: sensorNamedDecoded.toLowerCase(),
        measurement_type: measurementType,
        unit_symbol: encodedUnitSymbol,
      }),
    [
      boundEast,
      boundNorth,
      boundSouth,
      boundWest,
      encodedUnitSymbol,
      initialLimit,
      measurementType,
      initialOffset,
      sensorNamedDecoded,
      tagsDecoded,
      usernamesDecoded,
    ]
  );

  const thresholdFilters = useMemo(() => {
    return `${sensorName}?unit_symbol=${encodedUnitSymbol}`;
  }, [sensorName, encodedUnitSymbol]);

  // Effects
  useEffect(() => {
    if (loading || isFirstRender.current) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedSessions({ filters }))
        : dispatch(fetchMobileSessions({ filters }));
    }
    dispatch(setLoading(false));
  }, [filters, loading]);

  useEffect(() => {
    dispatch(fetchThresholds(thresholdFilters));
  }, [thresholdFilters]);

  useEffect(() => {
    if (!isFirstRenderForThresholds.current) {
      dispatch(resetUserThresholds());
    }
    // #DirtyButWorks :nervous-laugh: -> refactor when moving thresholds to url
    if (defaultThresholds.max !== 0) {
      isFirstRenderForThresholds.current = false;
    }
  }, [defaultThresholds]);

  useEffect(() => {
    if (isFirstRenderForThresholds.current) {
      dispatch(setUserThresholdValues(initialThresholds));
    }
    // #DirtyButWorks :nervous-laugh: -> refactor when moving thresholds to url
    if (initialThresholds.max === 0) {
      isFirstRenderForThresholds.current = false;
    }
  }, [initialThresholds]);

  useEffect(() => {
    if (currentUserSettings !== UserSettings.ModalView) {
      newSearchParams.set(UrlParamsTypes.sessionId, "");
      newSearchParams.set(UrlParamsTypes.streamId, "");
      navigate(`?${newSearchParams.toString()}`);
    }
    !isFirstRender.current && setPreviousZoomOnTheMap();
    isMobile && setPreviousZoomInTheURL();
    isFirstRender.current = false;
  }, [currentUserSettings]);

  useEffect(() => {
    if (previousUserSettings === UserSettings.CalendarView) {
      const intervalId = setInterval(() => {
        setPreviousZoomOnTheMap();
        clearInterval(intervalId);
      }, 10);
      return () => clearInterval(intervalId);
    }
  }, [mapInstance, previousUserSettings]);

  useEffect(() => {
    if (streamId && currentUserSettings === UserSettings.ModalView) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedStreamById(streamId))
        : dispatch(fetchMobileStreamById(streamId));
    }
  }, [streamId, currentUserSettings, fixedSessionTypeSelected]);

  useEffect(() => {
    if (realtimeMapUpdates) {
      dispatch(cleanSessions());
      dispatch(setLoading(true));
    }
  }, [
    boundEast,
    boundNorth,
    boundSouth,
    boundWest,
    realtimeMapUpdates,
    dispatch,
  ]);

  // Callbacks
  const handleMapIdle = useCallback(
    (event: MapEvent) => {
      const map = event.map;
      if (!mapInstance) {
        setMapInstance(map);
        map.setOptions({
          clickableIcons: false,
        });
      }

      if (isFirstRender.current) {
        if (currentUserSettings === UserSettings.MapView) {
          newSearchParams.set(UrlParamsTypes.sessionType, sessionType);
          map.setCenter(currentCenter);
          map.setZoom(currentZoom);
        }
        isFirstRender.current = false;
      } else {
        if (
          [UserSettings.MapView, UserSettings.CrowdMapView].includes(
            currentUserSettings
          )
        ) {
          const currentCenter = JSON.stringify(
            map.getCenter()?.toJSON() || previousCenter
          );
          const currentZoom = (map.getZoom() || previousZoom).toString();
          const bounds = map?.getBounds();
          if (!bounds) {
            return;
          }
          const north = bounds.getNorthEast().lat();
          const south = bounds.getSouthWest().lat();
          const east = bounds.getNorthEast().lng();
          const west = bounds.getSouthWest().lng();

          newSearchParams.set(UrlParamsTypes.boundEast, east.toString());
          newSearchParams.set(UrlParamsTypes.boundNorth, north.toString());
          newSearchParams.set(UrlParamsTypes.boundSouth, south.toString());
          newSearchParams.set(UrlParamsTypes.boundWest, west.toString());
          newSearchParams.set(UrlParamsTypes.currentCenter, currentCenter);
          newSearchParams.set(UrlParamsTypes.currentZoom, currentZoom);
          navigate(`?${newSearchParams.toString()}`);
        }
      }
    },
    [
      currentUserSettings,
      debouncedUpdateURL,
      mapInstance,
      searchParams,
      dispatch,
    ]
  );

  // Handlers;
  const handleMarkerClick = (
    selectedStreamId: number | null,
    id: number | null
  ) => {
    if (currentUserSettings !== UserSettings.SessionListView) {
      setPreviousZoomInTheURL();
    }

    if (selectedStreamId) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedStreamById(selectedStreamId))
        : dispatch(fetchMobileStreamById(selectedStreamId));
    }

    if (isMobile) {
      if (fixedSessionTypeSelected) {
        newSearchParams.set(
          UrlParamsTypes.previousUserSettings,
          currentUserSettings
        );
        newSearchParams.set(
          UrlParamsTypes.currentUserSettings,
          UserSettings.CalendarView
        );
        navigate(
          `/fixed_stream?streamId=${selectedStreamId}&${newSearchParams.toString()}`
        );
        return;
      }
    }

    if (!streamId) {
      newSearchParams.set(UrlParamsTypes.sessionId, id?.toString() || "");
      newSearchParams.set(
        UrlParamsTypes.streamId,
        selectedStreamId?.toString() || ""
      );
      newSearchParams.set(
        UrlParamsTypes.previousUserSettings,
        currentUserSettings
      );
      newSearchParams.set(
        UrlParamsTypes.currentUserSettings,
        UserSettings.ModalView
      );
      navigate(`?${newSearchParams.toString()}`);
    }

    if (streamId) {
      revertUserSettingsAndResetIds();
    }
  };

  const setPreviousZoomOnTheMap = () => {
    if (
      [UserSettings.MapView, UserSettings.CrowdMapView].includes(
        currentUserSettings
      ) &&
      ![
        UserSettings.MapView,
        UserSettings.MapLegendView,
        UserSettings.FiltersView,
        UserSettings.CrowdMapView,
      ].includes(previousUserSettings)
    ) {
      if (mapInstance) {
        mapInstance.setCenter(previousCenter);
        mapInstance.setZoom(previousZoom);
      }
    }
  };

  const setPreviousZoomInTheURL = () => {
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
        const newCenter = mapInstance.getCenter()?.toJSON();
        if (newCenter !== previousCenter) {
          newSearchParams.set(
            UrlParamsTypes.previousCenter,
            JSON.stringify(newCenter || currentCenter)
          );
        }
        const newZoom = mapInstance?.getZoom();
        if (newZoom !== previousZoom) {
          newSearchParams.set(
            UrlParamsTypes.previousZoom,
            newZoom?.toString() || currentZoom.toString()
          );
        }
        navigate(`?${newSearchParams.toString()}`);
      }
    }
  };

  const openFilters = () => {
    fixedSessionTypeSelected
      ? dispatch(fetchFixedSessions({ filters }))
      : dispatch(fetchMobileSessions({ filters }));
    goToUserSettings(UserSettings.FiltersView);
  };

  return (
    <>
      <GoogleMap
        mapId={mapId}
        mapTypeId={mapTypeId}
        defaultCenter={currentCenter}
        defaultZoom={currentZoom}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        scaleControl={true}
        style={S.containerStyle}
        onIdle={handleMapIdle}
        minZoom={MIN_ZOOM}
      >
        {fixedSessionsStatusFulfilled && fixedSessionTypeSelected && (
          <FixedMarkers
            sessions={sessionsPoints}
            onMarkerClick={handleMarkerClick}
            selectedStreamId={streamId}
            pulsatingSessionId={pulsatingSessionId}
          />
        )}
        {!fixedSessionTypeSelected &&
          ([UserSettings.CrowdMapView].includes(currentUserSettings) ||
          ([UserSettings.CrowdMapView].includes(previousUserSettings) &&
            [UserSettings.MapLegendView].includes(currentUserSettings)) ? (
            <CrowdMapMarkers
              pulsatingSessionId={pulsatingSessionId}
              sessions={sessionsPoints}
            />
          ) : (
            <MobileMarkers
              sessions={sessionsPoints}
              onMarkerClick={handleMarkerClick}
              selectedStreamId={streamId}
              pulsatingSessionId={pulsatingSessionId}
            />
          ))}

        {streamId && !fixedSessionTypeSelected && (
          <StreamMarkers
            sessions={mobileStreamPoints}
            unitSymbol={unitSymbol}
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
          onClose={() => revertUserSettingsAndResetIds()}
          sessionType={sessionType}
          streamId={streamId}
        />
      )}
      <S.MobileContainer>
        <S.MobileButtons>
          <SectionButton
            title={t("map.listSessions")}
            image={pinImage}
            alt={t("map.altListSessions")}
            onClick={() => goToUserSettings(UserSettings.SessionListView)}
          />
          <SectionButton
            title={t("map.legendTile")}
            image={mapLegend}
            alt={t("map.altlegendTile")}
            onClick={() => goToUserSettings(UserSettings.MapLegendView)}
          />
          <SectionButton
            title={t("filters.filters")}
            image={filterIcon}
            alt={t("filters.altFiltersIcon")}
            onClick={openFilters}
          />
        </S.MobileButtons>
        {currentUserSettings === UserSettings.MapLegendView && (
          <Legend onClose={() => goToUserSettings(previousUserSettings)} />
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
            onClose={() =>
              [UserSettings.CrowdMapView].includes(previousUserSettings)
                ? goToUserSettings(UserSettings.CrowdMapView)
                : goToUserSettings(UserSettings.MapView)
            }
          />
        )}
        {currentUserSettings === UserSettings.FiltersView && (
          <MobileSessionFilters
            onClose={() =>
              [UserSettings.CrowdMapView].includes(previousUserSettings)
                ? goToUserSettings(UserSettings.CrowdMapView)
                : goToUserSettings(UserSettings.MapView)
            }
          />
        )}
      </S.MobileContainer>
      {[UserSettings.MapView, UserSettings.CrowdMapView].includes(
        currentUserSettings
      ) && (
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

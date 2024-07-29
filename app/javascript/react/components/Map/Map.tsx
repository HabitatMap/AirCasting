import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Map as GoogleMap, MapEvent } from "@vis.gl/react-google-maps";

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
import { fetchFixedSessions } from "../../store/fixedSessionsSlice";
import { fetchFixedStreamById } from "../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
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
import { FixedMarkers } from "./Markers/FixedMarkers";
import { MobileMarkers } from "./Markers/MobileMarkers";
import { StreamMarkers } from "./Markers/StreamMarkers";

const Map = () => {
  // Hooks
  const dispatch = useAppDispatch();
  const {
    backToPreviousUserSettingsWithSessionAndStreamIdsReset,
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
    initialMeasurementType,
    initialOffset,
    previousCenter,
    previousUserSettings,
    previousZoom,
    initialSensorName,
    sessionId,
    sessionType,
    streamId,
    initialThresholds,
    initialUnitSymbol,
    searchParams,
    usernames,
    tags,
  } = useMapParams();
  const isMobile = useMobileDetection();
  const navigate = useNavigate();
  const isFirstRender = useRef(true);
  const { t } = useTranslation();

  const newSearchParams = new URLSearchParams(searchParams.toString());

  // State
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [pulsatingSessionId, setPulsatingSessionId] = useState<number | null>(
    null
  );

  // Selectors
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

  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;
  const listSessions = useAppSelector(
    fixedSessionTypeSelected
      ? selectFixedSessionsList
      : selectMobileSessionsList
  );

  const sessionsPoints = fixedSessionTypeSelected ? fixedPoints : mobilePoints;

  // Filters (temporary solution)
  const sensorName = fixedSessionTypeSelected
    ? initialSensorName
    : "AirBeam-PM2.5";

  const usernamesDecoded = usernames && decodeURIComponent(usernames);
  const tagsDecoded = tags && decodeURIComponent(tags);

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
        sensor_name: sensorName,
        measurement_type: initialMeasurementType,
        unit_symbol: initialUnitSymbol,
      }),
    [
      boundEast,
      boundNorth,
      boundSouth,
      boundWest,
      initialLimit,
      initialMeasurementType,
      initialOffset,
      initialUnitSymbol,
      sensorName,
      usernames,
      tags,
    ]
  );
  const preparedUnitSymbol = initialUnitSymbol.replace(/"/g, "");
  const encodedUnitSymbol = encodeURIComponent(preparedUnitSymbol);

  const thresholdFilters = `${sensorName}?unit_symbol=${encodedUnitSymbol}`;

  // Effects
  useEffect(() => {
    if (loading || isFirstRender.current) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedSessions({ filters }))
        : dispatch(fetchMobileSessions({ filters }));
    }
  }, [filters, loading, fixedSessionTypeSelected, filters]);

  useEffect(() => {
    dispatch(fetchThresholds(thresholdFilters));
    dispatch(setUserThresholdValues(initialThresholds));
  }, [initialThresholds, thresholdFilters]);

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
      } else {
        if (currentUserSettings === UserSettings.MapView) {
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
    [currentUserSettings, debouncedUpdateURL, mapInstance, searchParams]
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
      backToPreviousUserSettingsWithSessionAndStreamIdsReset();
    }
  };

  const setPreviousZoomOnTheMap = () => {
    if (
      currentUserSettings === UserSettings.MapView &&
      ![UserSettings.MapLegendView, UserSettings.FiltersView].includes(
        previousUserSettings
      )
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
        {!fixedSessionTypeSelected && (
          <MobileMarkers
            sessions={sessionsPoints}
            onMarkerClick={handleMarkerClick}
            selectedStreamId={streamId}
            pulsatingSessionId={pulsatingSessionId}
          />
        )}
        {streamId && !fixedSessionTypeSelected && (
          <StreamMarkers
            sessions={mobileStreamPoints}
            unitSymbol={initialUnitSymbol}
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
          onClose={() =>
            backToPreviousUserSettingsWithSessionAndStreamIdsReset()
          }
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
          <Legend onClose={() => goToUserSettings(UserSettings.MapView)} />
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
            onClose={() => goToUserSettings(UserSettings.MapView)}
          />
        )}
        {currentUserSettings === UserSettings.FiltersView && (
          <MobileSessionFilters
            onClose={() => goToUserSettings(UserSettings.MapView)}
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

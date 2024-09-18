import React, { useEffect, useMemo } from "react";

import { APIProvider } from "@vis.gl/react-google-maps";

import { Map } from "../../components/Map";
import { TRUE } from "../../const/booleans";
import { useFixedSessions } from "../../hooks/useFixedSessions";
import { RootState } from "../../store";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { selectFetchingData } from "../../store/mapSlice";
import {
  FixedSessionsTypes,
  selectFixedSessionsType,
} from "../../store/sessionFiltersSlice";
import { setActiveSessionsData } from "../../store/sessionsSlice";
import { selectDefaultThresholds } from "../../store/thresholdSlice";
import { UserSettings } from "../../types/userStates";
import { FocusTabController } from "../../utils/focusTabController";
import { useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "";

interface MapPageProps {
  children: React.ReactNode;
}

const MapPage: React.FC<MapPageProps> = ({ children }) => {
  const isMobile = useMobileDetection();
  const {
    boundEast,
    boundNorth,
    boundSouth,
    boundWest,
    currentCenter,
    currentUserSettings,
    currentZoom,
    fetchedSessions,
    goToUserSettings,
    isActive,
    isIndoor,
    limit,
    updateLimit,
    updateOffset,
    mapTypeId,
    measurementType,
    offset,
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
    timeFrom,
    timeTo,
    initialThresholds,
    unitSymbol,
    updateFetchedSessions,
    usernames,
  } = useMapParams();

  const isIndoorParameterInUrl = isIndoor === TRUE;

  // Selectors
  const defaultThresholds = useAppSelector(selectDefaultThresholds);
  const fetchableMobileSessionsCount = useAppSelector(
    (state: RootState) => state.mobileSessions.fetchableSessionsCount
  );

  const fetchingData = useAppSelector(selectFetchingData);
  const fixedSessionsType = useAppSelector(selectFixedSessionsType);

  const newSearchParams = new URLSearchParams(searchParams.toString());
  const preparedUnitSymbol = unitSymbol.replace(/"/g, "");
  const encodedUnitSymbol = encodeURIComponent(preparedUnitSymbol);
  const sensorNamedDecoded = decodeURIComponent(sensorName);
  const tagsDecoded = tags && decodeURIComponent(tags);
  const usernamesDecoded = usernames && decodeURIComponent(usernames);

  const isTimelapseView = currentUserSettings === UserSettings.TimelapseView;

  const zoomLevel = !Number.isNaN(currentZoom) ? Math.round(currentZoom) : 5;
  const dispatch = useAppDispatch();
  const activeSessionsDataStore = useAppSelector(
    (state: RootState) => state.sessions.activeSessionsData
  );

  const filters = useMemo(
    () =>
      JSON.stringify({
        time_from: timeFrom,
        time_to: timeTo,
        tags: tagsDecoded,
        usernames: usernamesDecoded,
        west: boundWest,
        east: boundEast,
        south: boundSouth,
        north: boundNorth,
        limit: limit,
        offset: offset,
        sensor_name: sensorNamedDecoded.toLowerCase(),
        measurement_type: measurementType,
        unit_symbol: encodedUnitSymbol,
        zoom_level: zoomLevel,
        is_indoor: isIndoorParameterInUrl,
      }),
    [
      boundEast,
      boundNorth,
      boundSouth,
      boundWest,
      encodedUnitSymbol,
      isIndoorParameterInUrl,
      limit,
      measurementType,
      offset,
      sensorNamedDecoded,
      tagsDecoded,
      timeFrom,
      timeTo,
      usernamesDecoded,
      zoomLevel,
    ]
  );

  const {
    data: activeSessionsData,
    isLoading: activeSessionsLoading,
    error: activeSessionsError,
    refetch: refetchActiveSessions,
  } = useFixedSessions(FixedSessionsTypes.ACTIVE, {
    filters,
    enabled: fetchingData,
  });

  useEffect(() => {
    if (activeSessionsData) {
      dispatch(setActiveSessionsData(activeSessionsData));
    }
  }, [activeSessionsData, dispatch]);

  return (
    <APIProvider
      apiKey={googleMapsApiKey}
      onLoad={() => {
        console.log("Maps API has loaded.");
      }}
    >
      {children}
      {/* {!isMobile && <MapButtons />} */}
      <FocusTabController />
      <Map
        activeSessionsData={activeSessionsDataStore}
        refetchActiveSessions={refetchActiveSessions}
      />
    </APIProvider>
  );
};

export { MapPage };

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

import clockIcon from "../../assets/icons/clockIcon.svg";
import filterIcon from "../../assets/icons/filterIcon.svg";
import mapLegend from "../../assets/icons/mapLegend.svg";
import pinImage from "../../assets/icons/pinImage.svg";
import { TRUE } from "../../const/booleans";
import { MIN_ZOOM } from "../../const/coordinates";
import { RootState, selectIsLoading } from "../../store";
import {
  selectFixedSessionsList,
  selectFixedSessionsPoints,
  selectFixedSessionsStatusFulfilled,
} from "../../store/fixedSessionsSelectors";
import {
  cleanSessions,
  fetchActiveFixedSessions,
  fetchDormantFixedSessions,
} from "../../store/fixedSessionsSlice";
import {
  fetchFixedStreamById,
  resetFixedStreamState,
} from "../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { selectIndoorSessionsList } from "../../store/indoorSessionsSelectors";
import {
  fetchActiveIndoorSessions,
  fetchDormantIndoorSessions,
} from "../../store/indoorSessionsSlice";
import { selectFetchingData, setFetchingData } from "../../store/mapSlice";
import { selectMarkersLoading } from "../../store/markersLoadingSlice";
import {
  selectMobileSessionPointsBySessionId,
  selectMobileSessionsList,
  selectMobileSessionsPoints,
} from "../../store/mobileSessionsSelectors";
import { fetchMobileSessions } from "../../store/mobileSessionsSlice";
import { selectMobileStreamPoints } from "../../store/mobileStreamSelectors";
import {
  fetchMobileStreamById,
  resetMobileStreamState,
} from "../../store/mobileStreamSlice";
import { fetchSensors } from "../../store/sensorsSlice";
import {
  FixedSessionsTypes,
  resetTags,
  selectFixedSessionsType,
  selectIsDormantSessionsType,
  selectTags,
  setFixedSessionsType,
} from "../../store/sessionFiltersSlice";
import {
  fetchThresholds,
  resetUserThresholds,
  selectDefaultThresholds,
  setUserThresholdValues,
} from "../../store/thresholdSlice";
import {
  selectCurrentTimestamp,
  selectTimelapseData,
  selectTimelapseIsLoading,
} from "../../store/timelapseSelectors";
import {
  fetchTimelapseData,
  setCurrentTimestamp,
} from "../../store/timelapseSlice";
import { SessionTypes } from "../../types/filters";
import { SessionList } from "../../types/sessionType";
import { UserSettings } from "../../types/userStates";
import * as Cookies from "../../utils/cookies";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { useHandleScrollEnd } from "../../utils/scrollEnd";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { Loader } from "../Loader/Loader";
import { SessionDetailsModal } from "../Modals/SessionDetailsModal";
import { TimelapseComponent } from "../Modals/TimelapseModal";
import { SectionButton } from "../SectionButton/SectionButton";
import { MobileSessionFilters } from "../SessionFilters/MobileSessionFilters";
import { MobileSessionList } from "../SessionsListView/MobileSessionList/MobileSessionList";
import { SessionsListView } from "../SessionsListView/SessionsListView";
import { ThresholdButtonVariant } from "../ThresholdConfigurator/ThresholdButtons/ThresholdButton";
import { ThresholdsConfigurator } from "../ThresholdConfigurator/ThresholdConfigurator";
import { Legend } from "./Legend/Legend";
import * as S from "./Map.style";
import { CrowdMapMarkers } from "./Markers/CrowdMapMarkers";
import { DormantMarkers } from "./Markers/DormantMarkers";
import { FixedMarkers } from "./Markers/FixedMarkers";
import { MobileMarkers } from "./Markers/MobileMarkers";
import { StreamMarkers } from "./Markers/StreamMarkers";
import { TimelapseMarkers } from "./Markers/TimelapseMarkers";
import mapStyles from "./mapUtils/mapStyles";
import mapStylesZoomedIn from "./mapUtils/mapStylesZoomedIn";

const Map = () => {
  const dispatch = useAppDispatch();
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
  const isMobile = useMobileDetection();
  const navigate = useNavigate();
  const isFirstRender = useRef(true);
  const isFirstRenderForThresholds = useRef(true);
  const { t } = useTranslation();
  const isIndoorParameterInUrl = isIndoor === TRUE;

  // State
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [pulsatingSessionId, setPulsatingSessionId] = useState<number | null>(
    null
  );

  // Selectors
  const defaultThresholds = useAppSelector(selectDefaultThresholds);
  const fetchableMobileSessionsCount = useAppSelector(
    (state: RootState) => state.mobileSessions.fetchableSessionsCount
  );
  const fetchableFixedSessionsCount = useAppSelector(
    (state: RootState) => state.fixedSessions.fetchableSessionsCount
  );

  const fetchingData = useAppSelector(selectFetchingData);
  const fixedSessionsType = useAppSelector(selectFixedSessionsType);
  const fixedPoints = useAppSelector((state) =>
    selectFixedSessionsPoints(state, fixedSessionsType)
  );

  const fixedSessionsStatusFulfilled = useAppSelector(
    selectFixedSessionsStatusFulfilled
  );

  const selectorsLoading = useAppSelector(selectIsLoading);
  const markersLoading = useAppSelector(selectMarkersLoading);
  const mobilePoints = sessionId
    ? useAppSelector(selectMobileSessionPointsBySessionId(sessionId))
    : useAppSelector(selectMobileSessionsPoints);
  const mobileStreamPoints = useAppSelector(selectMobileStreamPoints);
  const realtimeMapUpdates = useAppSelector(
    (state: RootState) => state.realtimeMapUpdates.realtimeMapUpdates
  );
  const timelapseData = useAppSelector(selectTimelapseData);
  const currentTimestamp = useAppSelector(selectCurrentTimestamp);
  const isDormant = useAppSelector(selectIsDormantSessionsType);
  const tagsToSelect = useAppSelector(selectTags);

  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;
  const listSessions = useAppSelector((state) => {
    if (fixedSessionTypeSelected) {
      if (isIndoorParameterInUrl) {
        return selectIndoorSessionsList(isDormant)(state);
      } else {
        return selectFixedSessionsList(state, fixedSessionsType);
      }
    } else {
      return selectMobileSessionsList(state);
    }
  });

  const memoizedMapStyles = useMemo(() => mapStyles, []);

  // update fixed session type based on the URL)
  useEffect(() => {
    if (isActive) {
      if (fixedSessionsType !== FixedSessionsTypes.ACTIVE) {
        dispatch(setFixedSessionsType(FixedSessionsTypes.ACTIVE));
      }
    } else {
      if (fixedSessionsType !== FixedSessionsTypes.DORMANT) {
        dispatch(setFixedSessionsType(FixedSessionsTypes.DORMANT));
      }
    }
  }, [isActive, fixedSessionsType, dispatch]);

  const fetchableIndoorSessionsCount = listSessions.length;

  const fetchableSessionsCount = useMemo(() => {
    return sessionType === SessionTypes.FIXED
      ? isIndoorParameterInUrl
        ? fetchableIndoorSessionsCount
        : fetchableFixedSessionsCount
      : fetchableMobileSessionsCount;
  }, [
    fetchableFixedSessionsCount,
    fetchableMobileSessionsCount,
    sessionType,
    fetchableIndoorSessionsCount,
    isIndoorParameterInUrl,
  ]);

  const memoizedTimelapseData = useMemo(() => timelapseData, [timelapseData]);

  const newSearchParams = new URLSearchParams(searchParams.toString());
  const preparedUnitSymbol = unitSymbol.replace(/"/g, "");
  const encodedUnitSymbol = encodeURIComponent(preparedUnitSymbol);
  const sensorNamedDecoded = decodeURIComponent(sensorName);
  const tagsDecoded = tags && decodeURIComponent(tags);
  const usernamesDecoded = usernames && decodeURIComponent(usernames);

  const isTimelapseView = currentUserSettings === UserSettings.TimelapseView;

  const isTimelapseDisabled =
    listSessions.length === 0 || isDormant || isIndoorParameterInUrl;

  const zoomLevel = !Number.isNaN(currentZoom) ? Math.round(currentZoom) : 5;

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

  const indoorSessionsFilters = useMemo(
    () =>
      JSON.stringify({
        time_from: timeFrom,
        time_to: timeTo,
        tags: tagsDecoded,
        usernames: usernamesDecoded,
        is_indoor: true,
        sensor_name: sensorNamedDecoded.toLowerCase(),
        measurement_type: measurementType,
        unit_symbol: encodedUnitSymbol,
      }),
    [
      encodedUnitSymbol,
      measurementType,
      sensorNamedDecoded,
      tagsDecoded,
      timeFrom,
      timeTo,
      usernamesDecoded,
    ]
  );

  const thresholdFilters = useMemo(() => {
    return `${sensorName}?unit_symbol=${encodedUnitSymbol}`;
  }, [sensorName, encodedUnitSymbol]);

  const applyMapStylesBasedOnZoom = (
    mapInstance: google.maps.Map | null,
    mapStylesZoomedIn: any,
    defaultMapStyles: any
  ) => {
    if (!mapInstance) return;

    const zoom = mapInstance.getZoom();

    if (zoom && zoom >= 5.5) {
      mapInstance.setOptions({
        styles: mapStylesZoomedIn,
      });
    } else {
      mapInstance.setOptions({
        styles: defaultMapStyles,
      });
    }
  };

  // Effects
  useEffect(() => {
    dispatch(fetchSensors(sessionType));
  }, [sessionType]);

  useEffect(() => {
    tagsToSelect.length > 0 && dispatch(resetTags());
  }, [
    sensorName,
    sessionType,
    isIndoorParameterInUrl,
    encodedUnitSymbol,
    measurementType,
    timeFrom,
    timeTo,
    usernames,
    isActive,
  ]);

  useEffect(() => {
    const isFirstLoad = isFirstRender.current;

    if (isFirstLoad && fetchedSessions > 0 && !fixedSessionTypeSelected) {
      const originalLimit = limit;
      updateLimit(fetchedSessions);

      const updatedFilters = {
        ...JSON.parse(filters),
        limit: fetchedSessions,
      };

      // Save bounds in cookies when fetching sessions
      Cookies.set("mapBoundsEast", boundEast.toString());
      Cookies.set("mapBoundsNorth", boundNorth.toString());
      Cookies.set("mapBoundsSouth", boundSouth.toString());
      Cookies.set("mapBoundsWest", boundWest.toString());

      dispatch(fetchMobileSessions({ filters: JSON.stringify(updatedFilters) }))
        .unwrap()
        .then(() => {
          updateLimit(originalLimit);
          updateFetchedSessions(fetchedSessions);
        });
      isFirstRender.current = false;
    } else {
      if (fetchingData || isFirstLoad) {
        // Save bounds in cookies when fetching sessions
        Cookies.set("mapBoundsEast", boundEast.toString());
        Cookies.set("mapBoundsNorth", boundNorth.toString());
        Cookies.set("mapBoundsSouth", boundSouth.toString());
        Cookies.set("mapBoundsWest", boundWest.toString());

        if (fixedSessionTypeSelected) {
          if (isIndoorParameterInUrl) {
            if (isActive) {
              dispatch(
                fetchActiveIndoorSessions({ filters: indoorSessionsFilters })
              ).unwrap();
            } else {
              dispatch(
                fetchDormantIndoorSessions({ filters: indoorSessionsFilters })
              ).unwrap();
            }
          } else {
            if (isActive) {
              dispatch(fetchActiveFixedSessions({ filters })).unwrap();
            } else {
              dispatch(fetchDormantFixedSessions({ filters })).unwrap();
            }
          }
        } else {
          dispatch(fetchMobileSessions({ filters }))
            .unwrap()
            .then((response) => {
              updateFetchedSessions(response.sessions.length);
            });
        }

        isFirstRender.current = false;
      }
    }

    dispatch(setFetchingData(false));
  }, [
    fetchingData,
    filters,
    fetchedSessions,
    limit,
    dispatch,
    fixedSessionTypeSelected,
    offset,
    updateFetchedSessions,
  ]);

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
      newSearchParams.set(UrlParamsTypes.isActive, isActive.toString());
      newSearchParams.set(UrlParamsTypes.sessionType, sessionType);
      newSearchParams.set(UrlParamsTypes.boundEast, boundEast.toString());
      newSearchParams.set(UrlParamsTypes.boundNorth, boundNorth.toString());
      newSearchParams.set(UrlParamsTypes.boundSouth, boundSouth.toString());
      newSearchParams.set(UrlParamsTypes.boundWest, boundWest.toString());

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
  }, [
    streamId,
    currentUserSettings,
    fixedSessionTypeSelected,
    previousUserSettings,
    isIndoorParameterInUrl,
  ]);

  useEffect(() => {
    if (realtimeMapUpdates) {
      dispatch(cleanSessions());
      dispatch(setFetchingData(true));
    }
  }, [
    boundEast,
    boundNorth,
    boundSouth,
    boundWest,
    realtimeMapUpdates,
    dispatch,
  ]);

  useEffect(() => {
    if (currentUserSettings === UserSettings.TimelapseView) {
      const storedBounds = {
        east: parseFloat(Cookies.get("mapBoundsEast") || boundEast.toString()),
        north: parseFloat(
          Cookies.get("mapBoundsNorth") || boundNorth.toString()
        ),
        south: parseFloat(
          Cookies.get("mapBoundsSouth") || boundSouth.toString()
        ),
        west: parseFloat(Cookies.get("mapBoundsWest") || boundWest.toString()),
      };

      const timelapseFilters = {
        ...JSON.parse(filters),
        west: storedBounds.west,
        east: storedBounds.east,
        north: storedBounds.north,
        south: storedBounds.south,
      };

      dispatch(
        fetchTimelapseData({ filters: JSON.stringify(timelapseFilters) })
      );
    }
  }, [currentUserSettings, fixedPoints]);

  const handleScrollEnd = useHandleScrollEnd(
    offset,
    listSessions,
    updateOffset,
    updateFetchedSessions,
    filters,
    fetchableMobileSessionsCount,
    fetchableFixedSessionsCount,
    isDormant
  );

  const handleMapIdle = useCallback(
    (event: MapEvent) => {
      const map = event.map;
      if (!mapInstance) {
        setMapInstance(map);
        map.setOptions({
          clickableIcons: false,
        });
      }

      applyMapStylesBasedOnZoom(map, mapStylesZoomedIn, memoizedMapStyles);

      if (isFirstRender.current) {
        if (currentUserSettings === UserSettings.MapView) {
          newSearchParams.set(UrlParamsTypes.sessionType, sessionType);
          newSearchParams.set(UrlParamsTypes.isActive, TRUE);
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
          Cookies.set(UrlParamsTypes.boundEast, east.toString());
          Cookies.set(UrlParamsTypes.boundNorth, north.toString());
          Cookies.set(UrlParamsTypes.boundSouth, south.toString());
          Cookies.set(UrlParamsTypes.boundWest, west.toString());
          Cookies.set(UrlParamsTypes.currentCenter, currentCenter);
          Cookies.set(UrlParamsTypes.currentZoom, currentZoom);
          navigate(`?${newSearchParams.toString()}`);
        }
      }
    },
    [currentUserSettings, mapInstance, searchParams, dispatch]
  );

  // ref to currentUserSettings to get the current value from URL
  const currentUserSettingsRef = useRef(currentUserSettings);

  useEffect(() => {
    currentUserSettingsRef.current = currentUserSettings;
  }, [currentUserSettings]);

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
          currentUserSettingsRef.current
        );
        newSearchParams.set(
          UrlParamsTypes.currentUserSettings,
          UserSettings.CalendarView
        );
        newSearchParams.set(UrlParamsTypes.sessionId, id?.toString() || "");
        newSearchParams.set(
          UrlParamsTypes.streamId,
          selectedStreamId?.toString() || ""
        );

        navigate(`/fixed_stream?${newSearchParams.toString()}`, {
          replace: true,
        });
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
        currentUserSettingsRef.current
      );
      newSearchParams.set(
        UrlParamsTypes.currentUserSettings,
        UserSettings.ModalView
      );

      navigate(`?${newSearchParams.toString()}`);
    }

    if (streamId) {
      revertUserSettingsAndResetIds();
      fixedSessionTypeSelected
        ? dispatch(resetFixedStreamState())
        : dispatch(resetMobileStreamState());
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
        UserSettings.TimelapseView,
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
      !isMobile &&
      currentUserSettings !== UserSettings.ModalView &&
      previousUserSettings !== UserSettings.CalendarView;
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
          Cookies.set(
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
          Cookies.set(
            UrlParamsTypes.previousZoom,
            newZoom?.toString() || currentZoom.toString()
          );
        }
        navigate(`?${newSearchParams.toString()}`);
      }
    }
  };

  const handleMapZoomStyles = useCallback(() => {
    if (mapInstance) {
      applyMapStylesBasedOnZoom(
        mapInstance,
        mapStylesZoomedIn,
        memoizedMapStyles
      );
    }
  }, [mapInstance, memoizedMapStyles]);

  const handleZoomChanged = () => {
    if (mapInstance) {
      handleMapZoomStyles();
    }
  };

  const openFilters = () => {
    goToUserSettings(UserSettings.FiltersView);
  };

  const openTimelapse = () => {
    // Clear existing timelapse markers before switching views
    dispatch(setCurrentTimestamp(""));

    // Add a small delay to ensure markers are cleared before view changes
    setTimeout(() => {
      goToUserSettings(
        currentUserSettings === UserSettings.TimelapseView
          ? previousUserSettings
          : UserSettings.TimelapseView
      );
    }, 0);
  };

  const isTimelapseLoading = useAppSelector(selectTimelapseIsLoading);

  const renderTimelapseMarkers = () => {
    if (
      currentUserSettings === UserSettings.TimelapseView &&
      currentTimestamp &&
      memoizedTimelapseData[currentTimestamp] &&
      !isTimelapseLoading
    ) {
      return (
        <TimelapseMarkers sessions={memoizedTimelapseData[currentTimestamp]} />
      );
    }
    return null;
  };

  return (
    <>
      {(selectorsLoading || markersLoading) && (
        <S.LoaderOverlay>
          <Loader />
        </S.LoaderOverlay>
      )}
      {isIndoorParameterInUrl && (
        <S.IndoorOvelay>
          <S.IndoorOverlayInfo $isMobile={isMobile}>
            <h1>{t("filters.indoorMapOverlay")}</h1>
          </S.IndoorOverlayInfo>
        </S.IndoorOvelay>
      )}
      <GoogleMap
        mapTypeId={mapTypeId}
        defaultCenter={currentCenter}
        defaultZoom={currentZoom}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        scaleControl={true}
        style={S.ContainerStyle}
        onIdle={handleMapIdle}
        minZoom={MIN_ZOOM}
        isFractionalZoomEnabled={true}
        styles={memoizedMapStyles}
        onZoomChanged={handleZoomChanged}
      >
        {fixedSessionsStatusFulfilled &&
          fixedSessionTypeSelected &&
          !isActive &&
          !isIndoorParameterInUrl && (
            <DormantMarkers
              sessions={fixedPoints}
              onMarkerClick={handleMarkerClick}
              selectedStreamId={streamId}
              pulsatingSessionId={pulsatingSessionId}
            />
          )}

        {isTimelapseView
          ? renderTimelapseMarkers()
          : fixedSessionsStatusFulfilled &&
            fixedSessionTypeSelected &&
            !isIndoorParameterInUrl &&
            isActive && (
              <FixedMarkers
                sessions={fixedPoints}
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
              sessions={mobilePoints}
            />
          ) : (
            <MobileMarkers
              sessions={mobilePoints}
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
            resetButtonVariant={ThresholdButtonVariant.IconOnly}
            isMobileOldStyle={
              isMobile && currentUserSettings === UserSettings.ModalView
            }
          />
        </S.ThresholdContainer>
      )}

      {currentUserSettings === UserSettings.ModalView && (
        <SessionDetailsModal
          onClose={() => {
            revertUserSettingsAndResetIds();
            fixedSessionTypeSelected
              ? dispatch(resetFixedStreamState())
              : dispatch(resetMobileStreamState());
          }}
          sessionType={sessionType}
          streamId={streamId}
        />
      )}
      {currentUserSettings === UserSettings.TimelapseView && (
        <TimelapseComponent
          onClose={() => {
            goToUserSettings(previousUserSettings);
          }}
        />
      )}
      <S.MobileContainer>
        {currentUserSettings !== UserSettings.ModalView &&
          currentUserSettings !== UserSettings.FiltersView && (
            <S.MobileButtons $isTimelapseView={isTimelapseView}>
              <SectionButton
                title={t("map.listSessions")}
                image={pinImage}
                alt={t("map.altListSessions")}
                onClick={() => goToUserSettings(UserSettings.SessionListView)}
                isNotTimelapseButton={isTimelapseView}
                isActive={currentUserSettings === UserSettings.SessionListView}
              />
              <SectionButton
                title={t("map.legendTile")}
                image={mapLegend}
                alt={t("map.altlegendTile")}
                onClick={() => goToUserSettings(UserSettings.MapLegendView)}
                isNotTimelapseButton={isTimelapseView}
                isActive={currentUserSettings === UserSettings.MapLegendView}
              />
              {fixedSessionTypeSelected && (
                <SectionButton
                  title={t("map.timelapsTile")}
                  image={clockIcon}
                  alt={t("map.altTimelapstile")}
                  onClick={openTimelapse}
                  isNotTimelapseButton={false}
                  isActive={currentUserSettings === UserSettings.TimelapseView}
                  isDisabled={isTimelapseDisabled}
                />
              )}
              <SectionButton
                title={t("filters.filters")}
                image={filterIcon}
                alt={t("filters.altFiltersIcon")}
                onClick={openFilters}
                isNotTimelapseButton={false}
              />
            </S.MobileButtons>
          )}
        {currentUserSettings === UserSettings.MapLegendView && (
          <Legend onClose={() => goToUserSettings(previousUserSettings)} />
        )}
        {currentUserSettings === UserSettings.SessionListView && isMobile && (
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
            onScrollEnd={handleScrollEnd}
            fetchableSessionsCount={fetchableSessionsCount}
          />
        )}
        {currentUserSettings === UserSettings.FiltersView && (
          <MobileSessionFilters
            onClose={() =>
              [UserSettings.CrowdMapView].includes(previousUserSettings)
                ? goToUserSettings(UserSettings.CrowdMapView)
                : goToUserSettings(UserSettings.MapView)
            }
            fetchableSessionsCount={fetchableSessionsCount}
          />
        )}
      </S.MobileContainer>
      {[UserSettings.MapView, UserSettings.CrowdMapView].includes(
        currentUserSettings
      ) &&
        !isMobile && (
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
              onScrollEnd={handleScrollEnd}
              fetchableSessionsCount={fetchableSessionsCount}
            />
          </S.DesktopContainer>
        )}
    </>
  );
};

export { Map };

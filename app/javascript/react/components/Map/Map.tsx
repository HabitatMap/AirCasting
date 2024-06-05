import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Map as GoogleMap, MapEvent } from "@vis.gl/react-google-maps";

import {
  DEFAULT_MAP_BOUNDS,
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
} from "../../const/coordinates";
import { RootState } from "../../store";
import { selectFixedSessionsPoints } from "../../store/fixedSessionsSelectors";
import { fetchFixedSessions } from "../../store/fixedSessionsSlice";
import { fetchFixedStreamById } from "../../store/fixedStreamSlice";
import { useAppDispatch } from "../../store/hooks";
import {
  selectMobileSessionPointsBySessionId,
  selectMobileSessionsPoints,
} from "../../store/mobileSessionsSelectors";
import { fetchMobileSessions } from "../../store/mobileSessionsSlice";
import { selectMobileStreamPoints } from "../../store/mobileStreamSelectors";
import { fetchMobileStreamById } from "../../store/mobileStreamSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { SessionDetailsModal } from "../Modals/SessionDetailsModal";
import * as S from "./Map.style";
import { FixedMarkers } from "./Markers/FixedMarkers";
import { MobileMarkers } from "./Markers/MobileMarkers";
import { StreamMarkers } from "./Markers/StreamMarkers";

const Map = () => {
  // const
<<<<<<< HEAD
=======
  const FIXED = "fixed";
  const MOBILE = "mobile";
>>>>>>> f6bd6c44 (chore: reorganize map file)
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

  // State
<<<<<<< HEAD
=======
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
>>>>>>> f6bd6c44 (chore: reorganize map file)
  const [mapBounds, setMapBounds] = useState({
    north: DEFAULT_MAP_BOUNDS.north,
    south: DEFAULT_MAP_BOUNDS.south,
    east: DEFAULT_MAP_BOUNDS.east,
    west: DEFAULT_MAP_BOUNDS.west,
  });
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [previousCenter, setPreviousCenter] = useState(DEFAULT_MAP_CENTER);
  const [previousZoom, setPreviousZoom] = useState(DEFAULT_ZOOM);
<<<<<<< HEAD
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>(
    SessionTypes.FIXED
  );
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
  const [shouldFetchSessions, setShouldFetchSessions] = useState(true);
  const fixedSessionTypeSelected: boolean =
    selectedSessionType === SessionTypes.FIXED;
=======
  const [selectedSessionType, setSelectedSessionType] = useState<string>(FIXED);
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
>>>>>>> f6bd6c44 (chore: reorganize map file)

  // Selectors
  const mapId = useSelector((state: RootState) => state.map.mapId);
  const mapTypeId = useSelector((state: RootState) => state.map.mapTypeId);
<<<<<<< HEAD
  const mobileStreamPoints = useSelector(selectMobileStreamPoints);
  const sessionsPoints = useSelector(
    fixedSessionTypeSelected
      ? selectFixedSessionsPoints
      : selectedSessionId
      ? selectMobileSessionPointsBySessionId(selectedSessionId)
      : selectMobileSessionsPoints
  );

  // Filters (temporary solution)
  const sensor_name = fixedSessionTypeSelected
    ? "government-pm2.5"
    : "airbeam-pm2.5";
=======
  const sessionsData = useSelector(
    selectedSessionType === FIXED
      ? selectFixedSessionsData
      : selectedStreamId
      ? selectMobileStreamData
      : selectMobileSessionsData
  );

  // Filters (temporary solution)
  const sensor_name =
    `${selectedSessionType}` === FIXED ? "government-pm2.5" : "airbeam-pm2.5";
>>>>>>> f6bd6c44 (chore: reorganize map file)
  const filters = JSON.stringify({
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
  });

  // Effects
  useEffect(() => {
<<<<<<< HEAD
<<<<<<< HEAD
    if (shouldFetchSessions) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedSessions({ filters }))
        : dispatch(fetchMobileSessions({ filters }));
      setShouldFetchSessions(false);
    }
  }, [dispatch, filters, shouldFetchSessions]);

  // Callbacks
=======
    selectedSessionType == FIXED
=======
    selectedSessionType === FIXED
>>>>>>> d7f7417b (feat: display mobile stream markers on the map)
      ? dispatch(fetchFixedSessions({ filters }))
      : dispatch(fetchMobileSessions({ filters }));
  }, [dispatch, filters, selectedSessionType]);

<<<<<<< HEAD
  const sessionsData = useSelector(
    selectedSessionType === FIXED
      ? selectFixedSessionsData
      : selectedStreamId
      ? selectMobileStreamData
      : selectMobileSessionsData
  );

>>>>>>> c28719df (chore: map data in selectors)
=======
  // Callbacks
>>>>>>> f6bd6c44 (chore: reorganize map file)
  const onIdle = useCallback(
    (event: MapEvent) => {
      const map = event.map;
      if (!mapInstance) {
        setMapInstance(map);
      }
      const bounds = map?.getBounds();
      if (!bounds) {
        console.log("Bounds not found");
        return;
      }
      const north = bounds.getNorthEast().lat();
      const south = bounds.getSouthWest().lat();
      const east = bounds.getNorthEast().lng();
      const west = bounds.getSouthWest().lng();
      setMapBounds({ north, south, east, west });
    },
    [mapInstance]
  );

  // Handlers
<<<<<<< HEAD
  const handleMarkerClick = (streamId: number | null, id: number | null) => {
=======
  const handleMarkerClick = (streamId: number | null) => {
    if (mapInstance) {
      setPreviousZoom(mapInstance.getZoom() || DEFAULT_ZOOM);
      setPreviousCenter(
        mapInstance.getCenter()?.toJSON() || DEFAULT_MAP_CENTER
      );
    }

>>>>>>> f6bd6c44 (chore: reorganize map file)
    if (streamId) {
<<<<<<< HEAD
      fixedSessionTypeSelected
        ? dispatch(fetchFixedStreamById(streamId))
=======
      selectedSessionType === FIXED
        ? null
>>>>>>> d7f7417b (feat: display mobile stream markers on the map)
        : dispatch(fetchMobileStreamById(streamId));
    }

    if (!selectedStreamId) {
      setSelectedSessionId(id);
      setSelectedStreamId(streamId);
      setModalOpen(false);
      setTimeout(() => {
        setModalOpen(true);
      }, 0);

      if (mapInstance) {
        setPreviousZoom(mapInstance.getZoom() || DEFAULT_ZOOM);
        setPreviousCenter(
          mapInstance.getCenter()?.toJSON() || DEFAULT_MAP_CENTER
        );
      }
    }

    if (selectedStreamId) {
      setModalOpen(false);
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
    setModalOpen(false);
    if (mapInstance) {
      mapInstance.setZoom(previousZoom);
      mapInstance.setCenter(previousCenter);
    }
  };

  const handleClick = (type: SessionType) => {
    setSelectedSessionType(type);
    setShouldFetchSessions(true);
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
        mapId={mapId || null}
        mapTypeId={mapTypeId}
        defaultCenter={DEFAULT_MAP_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        scaleControl={true}
        style={S.containerStyle}
        onIdle={onIdle}
      >
<<<<<<< HEAD
        {fixedSessionTypeSelected ? (
          <FixedMarkers
            sessions={sessionsPoints}
            onMarkerClick={handleMarkerClick}
            selectedStreamId={selectedStreamId}
          />
        ) : (
          <MobileMarkers
            sessions={sessionsPoints}
            onMarkerClick={handleMarkerClick}
            selectedStreamId={selectedStreamId}
          />
        )}
        {selectedStreamId && !fixedSessionTypeSelected && (
          <StreamMarkers
            sessions={mobileStreamPoints}
            unitSymbol={unit_symbol}
          />
        )}
=======
        <Markers
          sessions={sessionsData}
          onMarkerClick={handleMarkerClick}
          selectedStreamId={selectedStreamId}
        />
>>>>>>> c28719df (chore: map data in selectors)
      </GoogleMap>
      {modalOpen && (
        <SessionDetailsModal
          onClose={handleCloseModal}
          sessionType={selectedSessionType}
          streamId={selectedStreamId}
        />
      )}
      <button
        onClick={() => setShouldFetchSessions(true)}
        style={{
          position: "absolute",
          top: "10rem",
          left: "50%",
          transform: "translate(-50%, -50%)",
          padding: "10px 20px",
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          borderRadius: "5px",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        Redo Search in Map
      </button>
    </>
  );
};

export { Map };

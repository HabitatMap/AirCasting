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
import { Markers } from "./Markers/Markers";
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

  // State
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
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>(
    SessionTypes.FIXED
  );
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
  const fixedSessionTypeSelected: boolean =
    selectedSessionType === SessionTypes.FIXED;

  // Selectors
  const mapId = useSelector((state: RootState) => state.map.mapId);
  const mapTypeId = useSelector((state: RootState) => state.map.mapTypeId);
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
    fixedSessionTypeSelected
      ? dispatch(fetchFixedSessions({ filters }))
      : dispatch(fetchMobileSessions({ filters }));
  }, [dispatch, filters, selectedSessionType]);

  // Callbacks
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
  const handleMarkerClick = (streamId: number | null, id: number | null) => {
    if (mapInstance) {
      setPreviousZoom(mapInstance.getZoom() || DEFAULT_ZOOM);
      setPreviousCenter(
        mapInstance.getCenter()?.toJSON() || DEFAULT_MAP_CENTER
      );
    }

    if (streamId) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedStreamById(streamId))
        : dispatch(fetchMobileStreamById(streamId));
    }

    setSelectedSessionId(id);
    setSelectedStreamId(streamId);
    setModalOpen(false);
    setTimeout(() => {
      setModalOpen(true);
    }, 0);
  };

  const handleCloseModal = () => {
    setSelectedStreamId(null);
    setModalOpen(false);
    if (mapInstance) {
      mapInstance.setZoom(previousZoom);
      mapInstance.setCenter(previousCenter);
    }
  };

  const handleClick = (type: string) => {
    setSelectedSessionType(type);
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
        {selectedStreamId && !fixedSessionTypeSelected && (
          <StreamMarkers sessions={mobileStreamPoints} />
        )}
        <Markers
          sessions={sessionsPoints}
          onMarkerClick={handleMarkerClick}
          selectedStreamId={selectedStreamId}
        />
      </GoogleMap>
      {modalOpen && (
        <SessionDetailsModal
          onClose={handleCloseModal}
          sessionType={selectedSessionType}
          streamId={selectedStreamId}
        />
      )}
    </>
  );
};

export { Map };

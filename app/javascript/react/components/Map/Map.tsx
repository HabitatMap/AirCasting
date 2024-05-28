import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Map as GoogleMap, MapEvent } from "@vis.gl/react-google-maps";

import mapStyles from "./mapStyles";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_BOUNDS,
  DEFAULT_ZOOM,
} from "../../const/coordinates";
import { RootState } from "../../store";
import { fetchFixedSessions } from "../../store/fixedSessionsSlice";
import { containerStyle } from "./Map.style";
import { Markers } from "./Markers/Markers";
import { selectSessionsData } from "../../store/fixedSessionsSelectors";
import { Session } from "./Markers/SessionType";
import { useAppDispatch } from "../../store/hooks";

const Map = () => {
  const dispatch = useAppDispatch();

  // Those filters are temporary and will be replaced with the actual filters
  const timeFrom = "1685318400";
  const timeTo = "1717027199";
  const tags = "";
  const usernames = "";
  const limit = 100;
  const offset = 0;
  const sensor_name = "government-pm2.5";
  const measurement_type = "Particulate Matter";
  const unit_symbol = "µg/m³";

  const [mapBounds, setMapBounds] = useState({
    north: DEFAULT_MAP_BOUNDS.north,
    south: DEFAULT_MAP_BOUNDS.south,
    east: DEFAULT_MAP_BOUNDS.east,
    west: DEFAULT_MAP_BOUNDS.west,
  });

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

  useEffect(() => {
    dispatch(fetchFixedSessions({ filters }));
  }, [dispatch, filters]);

  const sessionsData = useSelector(selectSessionsData);

  const mappedSessionsData: Session[] = sessionsData.map((session) => {
    return {
      id: session.id,
      lastMeasurementValue: session.lastMeasurementValue,
      point: {
        lat: session.latitude,
        lng: session.longitude,
        key: session.key.toString(),
      },
    };
  });

  const mapTypeId = useSelector((state: RootState) => state.map.mapTypeId);
  const [isSessionDetailsModalOpen, setSessionDetailsModalOpen] =
    useState<boolean>(false);
  const [modalPosition, setModalPosition] = useState<{
    bottom: number;
    left: number;
  }>({ bottom: 0, left: 0 });

  const handleOpenDesktopSessionDetailsModal = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setModalPosition({
      bottom: window.innerHeight - rect.bottom + rect.height + 1,
      left: rect.left,
    });
    setSessionDetailsModalOpen(true);
  };

  const handleOpenSessionDetailstModal = () => {
    setSessionDetailsModalOpen(true);
  };

  const handleCloseSessionDetailsModal = () => {
    setSessionDetailsModalOpen(false);
  };

  const onIdle = useCallback((event: MapEvent) => {
    const map = event.map;
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
  }, []);

  return (
    <>
      <GoogleMap
        mapId={"3808fe50f232092d" || null}
        mapTypeId={mapTypeId}
        defaultCenter={DEFAULT_MAP_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        scaleControl={true}
        style={containerStyle}
        styles={mapStyles}
        onIdle={onIdle}
      >
        <Markers sessions={mappedSessionsData} />
      </GoogleMap>
      <SessionDetailsModal
        sessionId="1"
        // isOpen={isSessionDetailsModalOpen}
        isOpen={true}
        onClose={handleCloseSessionDetailsModal}
        position={modalPosition}
      />
    </>
  );
};

export { Map };

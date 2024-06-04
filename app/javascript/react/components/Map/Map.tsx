import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Map as GoogleMap, MapEvent } from "@vis.gl/react-google-maps";

import {
  DEFAULT_MAP_BOUNDS,
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
} from "../../const/coordinates";
import { RootState } from "../../store";
import { selectSessionsData } from "../../store/fixedSessionsSelectors";
import { fetchFixedSessions } from "../../store/fixedSessionsSlice";
import { useAppDispatch } from "../../store/hooks";
import { fetchMobileSessions } from "../../store/mobileSessionsSlice";
import { SessionDetailsModal } from "../Modals/SessionDetailsModal";
import * as S from "./Map.style";
import mapStyles from "./mapStyles";
import { Markers } from "./Markers/Markers";
import { Session } from "./Markers/SessionType";

const Map = () => {
  const dispatch = useAppDispatch();
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const [previousZoom, setPreviousZoom] = useState(DEFAULT_ZOOM);
  const [previousCenter, setPreviousCenter] = useState(DEFAULT_MAP_CENTER);
  const FIXED = "fixed";
  const MOBILE = "mobile";

  const timeFrom = "1685318400";
  const timeTo = "1717027199";
  const tags = "";
  const usernames = "";
  const limit = 100;
  const offset = 0;
  const sensor_name =
    `${selectedSessionType}` == FIXED ? "government-pm2.5" : "airbeam-pm2.5";
  const measurement_type = "Particulate Matter";
  const unit_symbol = "µg/m³";

  const dispatch = useAppDispatch();
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<string>(FIXED);
  const [mapBounds, setMapBounds] = useState({
    north: DEFAULT_MAP_BOUNDS.north,
    south: DEFAULT_MAP_BOUNDS.south,
    east: DEFAULT_MAP_BOUNDS.east,
    west: DEFAULT_MAP_BOUNDS.west,
  });
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const mapTypeId = useSelector((state: RootState) => state.map.mapTypeId);
  const mapId = useSelector((state: RootState) => state.map.mapId);

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
    selectedSessionType == FIXED
      ? dispatch(fetchFixedSessions({ filters }))
      : dispatch(fetchMobileSessions({ filters }));
  }, [dispatch, filters, selectedSessionType]);

  const sessionsData = useSelector(selectSessionsData);

  const mappedSessionsData: Session[] = sessionsData.map((session) => {
    return {
      id: session.id,
      lastMeasurementValue: session.lastMeasurementValue,
      point: {
        lat: session.latitude,
        lng: session.longitude,
        streamId: session.streamId.toString(),
      },
    };
  });

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
      setCurrentZoom(map.getZoom() || DEFAULT_ZOOM);
    },
    [mapInstance]
  );

  const handleMarkerClick = (streamId: React.SetStateAction<number | null>) => {
    if (mapInstance) {
      setPreviousZoom(mapInstance.getZoom() || DEFAULT_ZOOM);
      setPreviousCenter(
        mapInstance.getCenter()?.toJSON() || DEFAULT_MAP_CENTER
      );
    }
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

  console.log("selectedSessionType", selectedSessionType);

  return (
    <>
      {/* temporary solution, ticket: Session Filter: General filters */}
      <S.FixedButton onClick={() => handleClick(FIXED)}>
        fixed - government-pm2.5
      </S.FixedButton>
      <S.MobileButton onClick={() => handleClick(MOBILE)}>
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
        <Markers
          sessions={mappedSessionsData}
          onMarkerClick={handleMarkerClick}
          selectedStreamId={selectedStreamId}
        />
      </GoogleMap>
      {modalOpen && (
        <SessionDetailsModal
          streamId={selectedStreamId}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export { Map };

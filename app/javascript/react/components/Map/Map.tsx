import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

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
import { containerStyle } from "./Map.style";
import mapStyles from "./mapStyles";
import { Markers } from "./Markers/Markers";
import { Session } from "./Markers/SessionType";

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
    west: mapBounds.west.toFixed(15),
    east: mapBounds.east.toFixed(15),
    south: mapBounds.south.toFixed(15),
    north: mapBounds.north.toFixed(15),
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
  const mapId = useSelector((state: RootState) => state.map.mapId);

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
        mapId={mapId || null}
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
    </>
  );
};

export { Map };

import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Map as GoogleMap, MapEvent } from "@vis.gl/react-google-maps";

import mapStyles from "./mapStyles";
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from "../../const/coordinates";
import { RootState } from "../../store";
import { fetchFixedSessions } from "../../store/fixedSessionsSlice";
import { containerStyle } from "./Map.style";
import { Markers } from "./Markers/Markers";
import { selectSessionsData } from "../../store/fixedSessionsSelectors";
import { Session } from "./Markers/SessionType";
import { useAppDispatch } from "../../store/hooks";

const Map = () => {
  const dispatch = useAppDispatch();

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
    north: 47.886881016621686,
    south: 24.507143507735677,
    east: -59.018555062500006,
    west: -132.4072269375,
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

  console.log("sessionsData:", sessionsData);

  const mappedSessionsData: Session[] = sessionsData.map((session) => {
    console.log("Session:", session);
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
    console.log("North:", north, "South:", south, "East:", east, "West:", west);
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

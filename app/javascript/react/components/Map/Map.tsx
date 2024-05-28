import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import { Map as GoogleMap } from "@vis.gl/react-google-maps";

import mapStyles from "./mapStyles";
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from "../../const/coordinates";
import { RootState } from "../../store";
import { fetchSessions } from "../../store/fixedSessionsSlice";
import { useAppDispatch } from "../../store/hooks";
import { containerStyle } from "./Map.style";
import { Markers } from "./Markers/Markers";
import trees from "./trees";

const Map = () => {
  const dispatch = useAppDispatch();

  const timeFrom = "1685232000";
  const timeTo = "1716940799";
  const tags = "";
  const usernames = "";
  const west = -127.13378943750001;
  const east = -64.29199256250001;
  const south = 24.507143507735677;
  const north = 47.886881016621686;
  const limit = 100;
  const offset = 0;
  const sensor_name = "airbeam-pm2.5";
  const measurement_type = "Particulate Matter";
  const unit_symbol = "µg/m³";

  const filters = JSON.stringify({
    time_from: timeFrom,
    time_to: timeTo,
    tags: tags,
    usernames: usernames,
    west: west,
    east: east,
    south: south,
    north: north,
    limit: limit,
    offset: offset,
    sensor_name: sensor_name,
    measurement_type: measurement_type,
    unit_symbol: unit_symbol,
  });

  useEffect(() => {
    dispatch(
      fetchSessions({
        filters: filters,
      })
    );
  }, []);

  const mapTypeId = useSelector((state: RootState) => state.map.mapTypeId);
  const mapId = useSelector((state: RootState) => state.map.mapId);

  return (
    <>
      <GoogleMap
        mapId={mapId || null}
        mapTypeId={mapTypeId}
        // defaultCenter={DEFAULT_MAP_CENTER}
        defaultCenter={{ lat: 43.64, lng: -79.41 }}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        scaleControl={true}
        style={containerStyle}
        styles={mapStyles}
      >
        <Markers points={trees} />
      </GoogleMap>
    </>
  );
};

export { Map };

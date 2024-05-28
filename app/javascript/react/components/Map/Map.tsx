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

  const timeFrom = "1685145600";
  const timeTo = "1716854399";
  const tags = "";
  const usernames = "";
  const west = -116.63085975000001;
  const east = -74.79492225000001;
  const south = 29.22889024563508;
  const north = 44.2137100866473;
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
    console.log("filters", `${encodeURIComponent(filters)}`);
    dispatch(
      fetchSessions({
        filters:
          "%7B%22time_from%22%3A%221685232000%22%2C%22time_to%22%3A%221716940799%22%2C%22tags%22%3A%22%22%2C%22usernames%22%3A%22%22%2C%22west%22%3A-127.13378943750001%2C%22east%22%3A-64.29199256250001%2C%22south%22%3A24.507143507735677%2C%22north%22%3A47.886881016621686%2C%22limit%22%3A100%2C%22offset%22%3A0%2C%22sensor_name%22%3A%22airbeam-pm2.5%22%2C%22measurement_type%22%3A%22Particulate%20Matter%22%2C%22unit_symbol%22%3A%22%C2%B5g%2Fm%C2%B3%22%7D",
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

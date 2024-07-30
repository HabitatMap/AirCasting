import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

import { useMap } from "@vis.gl/react-google-maps";

import {
  fetchCrowdMapData,
  selectCrowdMapRectangles,
} from "../../../store/crowdMapSlice";
import { useAppDispatch } from "../../../store/hooks";
import { selectMobileSessionsStreamIds } from "../../../store/mobileSessionsSelectors";
import { Session } from "../../../types/sessionType";
import { useMapParams } from "../../../utils/mapParamsHandler";

type Props = {
  sessions: Session[];
};

const CrowdMapMarkers = ({ sessions }: Props) => {
  const dispatch = useAppDispatch();
  const map = useMap();
  const {
    boundEast,
    boundNorth,
    boundSouth,
    boundWest,
    initialMeasurementType,
    tags,
    initialUnitSymbol,
    usernames,
  } = useMapParams();

  const crowdMapRectangles = useSelector(selectCrowdMapRectangles);
  const mobileSessionsStreamIds = useSelector(selectMobileSessionsStreamIds);

  const filters = useMemo(
    () =>
      JSON.stringify({
        east: boundEast,
        grid_size_x: 50, // TODO: temporary solution, ticket: Session Filter [Mobile]: Grid size
        grid_size_y: 50, // TODO: temporary solution, ticket: Session Filter [Mobile]: Grid size
        measurement_type: initialMeasurementType, // TODO: temporary solution, ticket: Session Filter [Both] Parameter Picker (Custom)
        north: boundNorth,
        sensor_name: "AirBeam-PM2.5", // TODO: temporary solution, ticket: Session Filter [Both]: Sensor Picker
        south: boundSouth,
        stream_ids: mobileSessionsStreamIds,
        tags: tags,
        time_from: "1685318400", // TODO: temporary solution, ticket: Session Filter [Both]: Year Picker
        time_to: "1717027199", // TODO: temporary solution, ticket: Session Filter [Both]: Year Picker
        unit_symbol: initialUnitSymbol, // TODO: temporary solution, ticket: Session Filter [Both]: Parameter Picker (Basic)
        usernames: usernames,
        west: boundWest,
      }),
    [
      boundEast,
      boundNorth,
      boundSouth,
      boundWest,
      initialMeasurementType,
      tags,
      initialUnitSymbol,
      usernames,
    ]
  );

  useEffect(() => {
    dispatch(fetchCrowdMapData(filters));
  }, [filters]);

  useEffect(() => {
    if (crowdMapRectangles.length > 0) {
      crowdMapRectangles.map(
        (rectangle) =>
          new google.maps.Rectangle({
            bounds: new google.maps.LatLngBounds(
              new google.maps.LatLng(rectangle.south, rectangle.west),
              new google.maps.LatLng(rectangle.north, rectangle.east)
            ),
            map: map,
          })
      );
    }
  }, [crowdMapRectangles]);

  // const thresholds = useSelector(selectThresholds);

  return null;
};

export { CrowdMapMarkers };

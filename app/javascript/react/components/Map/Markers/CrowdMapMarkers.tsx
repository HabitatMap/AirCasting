import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

import { useMap } from "@vis.gl/react-google-maps";

import {
  fetchCrowdMapData,
  selectCrowdMapRectangles,
} from "../../../store/crowdMapSlice";
import { useAppDispatch } from "../../../store/hooks";
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
        stream_ids: [
          2495371, 2495208, 2495174, 2495170, 2495072, 2495087, 2495081,
          2495049, 2495043, 2495036, 2495015, 2495003, 2494972, 2494987,
          2495239, 2494788, 2494765, 2494710, 2494739, 2494670, 2494745,
          2494629, 2494634, 2494641, 2494428, 2494677, 2494662, 2494649,
          2494601, 2494548, 2494536, 2494553, 2494503, 2494498, 2494614,
          2494488, 2494444, 2494470, 2494531, 2494438, 2494434, 2494424,
          2494414, 2494290, 2494245, 2494227, 2494216, 2494261, 2494255,
          2494239, 2494185, 2494015, 2493989, 2494128, 2494198, 2494093,
          2494068, 2494063, 2494122, 2494046, 2494156, 2494007, 2494000,
          2493984, 2493965, 2493860, 2493829, 2493758, 2494250, 2493753,
          2493746, 2493740, 2493575, 2494274, 2493783, 2494269, 2493775,
          2493771, 2493766, 2493692, 2493681, 2493621, 2493305, 2494091,
          2493548, 2493530, 2493515, 2493512, 2493479, 2493417, 2493462,
          2493474, 2493457, 2493410, 2493422, 2493452, 2493404, 2493399,
          2493469, 2493394,
        ],
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

  const crowdMapRectangles = useSelector(selectCrowdMapRectangles);

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

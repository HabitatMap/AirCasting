import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import { fetchCrowdMapData } from "../../../store/crowdMapSlice";
import { useAppDispatch } from "../../../store/hooks";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { SessionDotMarker } from "./SessionDotMarker/SessionDotMarker";

import type { Marker } from "@googlemaps/markerclusterer";
type Props = {
  sessions: Session[];
};

const CrowdMapMarkers = ({ sessions }: Props) => {
  const dispatch = useAppDispatch();
  const {
    boundEast,
    boundNorth,
    boundSouth,
    boundWest,
    initialMeasurementType,
    initialUnitSymbol,
  } = useMapParams();

  const filters = useMemo(
    () =>
      JSON.stringify({
        east: boundEast,
        grid_size_x: 53,
        grid_size_y: 47,
        measurement_type: initialMeasurementType,
        north: boundNorth,
        sensor_name: "AirBeam-PM2.5",
        south: boundSouth,
        stream_ids: [2495370, 2495205, 2494971],
        tags: "",
        time_from: "1685318400",
        time_to: "1717027199",
        unit_symbol: initialUnitSymbol,
        usernames: "",
        west: boundWest,
      }),
    [
      boundEast,
      boundNorth,
      boundSouth,
      boundWest,
      initialMeasurementType,
      initialUnitSymbol,
    ]
  );

  useEffect(() => {
    dispatch(fetchCrowdMapData(filters));
  }, []);

  const map = useMap();

  const thresholds = useSelector(selectThresholds);

  const [markers, setMarkers] = useState<{ [streamId: string]: Marker | null }>(
    {}
  );

  return (
    <>
      {sessions.map((session) => (
        <AdvancedMarker
          position={session.point}
          key={session.point.streamId}
          zIndex={1000}
          ref={(marker) => {
            if (marker && !markers[session.point.streamId]) {
              setMarkers((prev) => ({
                ...prev,
                [session.point.streamId]: marker,
              }));
            }
          }}
        >
          <SessionDotMarker
            color={getColorForValue(thresholds, session.lastMeasurementValue)}
            shouldPulse={false}
            onClick={() => {}}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

export { CrowdMapMarkers };

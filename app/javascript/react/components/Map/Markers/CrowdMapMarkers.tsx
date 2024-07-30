import React, { useEffect, useMemo, useRef, useState } from "react";

import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import {
  fetchCrowdMapData,
  selectCrowdMapRectangles,
} from "../../../store/crowdMapSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectMobileSessionsStreamIds } from "../../../store/mobileSessionsSelectors";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { SessionDotMarker } from "./SessionDotMarker/SessionDotMarker";

import type { Marker } from "@googlemaps/markerclusterer";

type Props = {
  pulsatingSessionId: number | null;
  sessions: Session[];
};

const CrowdMapMarkers = ({ pulsatingSessionId, sessions }: Props) => {
  const dispatch = useAppDispatch();

  const crowdMapRectangles = useAppSelector(selectCrowdMapRectangles);
  const mobileSessionsStreamIds = useAppSelector(selectMobileSessionsStreamIds);
  const thresholds = useAppSelector(selectThresholds);

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
  const rectanglesRef = useRef<google.maps.Rectangle[]>([]);
  const [markers, setMarkers] = useState<{ [streamId: string]: Marker | null }>(
    {}
  );

  const displayedSession: Session | undefined = sessions.find(
    (session) => session.id === pulsatingSessionId
  );

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
      mobileSessionsStreamIds,
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
      const newRectangles = crowdMapRectangles.map(
        (rectangle) =>
          new google.maps.Rectangle({
            bounds: new google.maps.LatLngBounds(
              new google.maps.LatLng(rectangle.south, rectangle.west),
              new google.maps.LatLng(rectangle.north, rectangle.east)
            ),
            map: map,
          })
      );
      rectanglesRef.current.push(...newRectangles);
    }

    // Cleanup function to remove rectangles on unmount
    return () => {
      rectanglesRef.current.forEach((rectangle) => rectangle.setMap(null));
      rectanglesRef.current = [];
    };
  }, [crowdMapRectangles, map]);

  const renderMarker = (displayedSession: Session) => {
    return (
      <AdvancedMarker
        position={displayedSession.point}
        key={displayedSession.point.streamId}
        zIndex={1000}
        ref={(marker) => {
          if (marker && !markers[displayedSession.point.streamId]) {
            setMarkers((prev) => ({
              ...prev,
              [displayedSession.point.streamId]: marker,
            }));
          }
        }}
      >
        {
          <SessionDotMarker
            color={getColorForValue(
              thresholds,
              displayedSession.lastMeasurementValue
            )}
            shouldPulse={false}
            onClick={() => {}}
          />
        }
      </AdvancedMarker>
    );
  };

  if (displayedSession) {
    return renderMarker(displayedSession);
  } else {
    return null;
  }
};

export { CrowdMapMarkers };

import React, { useEffect, useMemo, useRef, useState } from "react";

import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import {
  fetchCrowdMapData,
  selectCrowdMapRectangles,
} from "../../../store/crowdMapSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { selectMobileSessionsStreamIds } from "../../../store/mobileSessionsSelectors";
import {
  fetchRectangleData,
  setVisibility,
} from "../../../store/rectangleSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import ClusterInfo from "./ClusterInfo"; // Assuming you have a ClusterInfo component
import { SessionDotMarker } from "./SessionDotMarker/SessionDotMarker";

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
    measurementType,
    tags,
    unitSymbol,
    usernames,
  } = useMapParams();
  const filters = useMemo(
    () =>
      JSON.stringify({
        east: boundEast,
        grid_size_x: 50, // TODO: temporary solution, ticket: Session Filter [Mobile]: Grid size
        grid_size_y: 50, // TODO: temporary solution, ticket: Session Filter [Mobile]: Grid size
        measurement_type: measurementType,
        north: boundNorth,
        sensor_name: "AirBeam-PM2.5", // TODO: temporary solution, ticket: Session Filter [Both]: Sensor Picker
        south: boundSouth,
        stream_ids: mobileSessionsStreamIds,
        tags: tags,
        time_from: "1685318400", // TODO: temporary solution, ticket: Session Filter [Both]: Year Picker
        time_to: "1717027199", // TODO: temporary solution, ticket: Session Filter [Both]: Year Picker
        unit_symbol: unitSymbol,
        usernames: usernames,
        west: boundWest,
      }),
    [
      boundEast,
      boundNorth,
      boundSouth,
      boundWest,
      measurementType,
      mobileSessionsStreamIds,
      tags,
      unitSymbol,
      usernames,
    ]
  );

  const rectanglesRef = useRef<google.maps.Rectangle[]>([]);
  const [selectedRectangle, setSelectedRectangle] =
    useState<google.maps.Rectangle | null>(null);
  const [clusterPosition, setClusterPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [clusterVisible, setClusterVisible] = useState(false);
  const [clusterData, setClusterData] = useState<ClusterData | null>(null);
  const [clusterLoading, setClusterLoading] = useState(false);

  const crowdMapRectanglesLength: number = crowdMapRectangles.length;
  const displayedSession: Session | undefined = sessions.find(
    (session) => session.id === pulsatingSessionId
  );

  useEffect(() => {
    dispatch(fetchCrowdMapData(filters));
  }, [filters, dispatch]);

  useEffect(() => {
    dispatch(setMarkersLoading(true));
  }, [dispatch, crowdMapRectanglesLength]);

  useEffect(() => {
    if (rectanglesRef.current.length >= crowdMapRectanglesLength) {
      dispatch(setMarkersLoading(false));
    }
  }, [dispatch, rectanglesRef.current.length, crowdMapRectanglesLength]);

  useEffect(() => {
    if (crowdMapRectanglesLength > 0) {
      const newRectangles = crowdMapRectangles.map((rectangle) => {
        const newRectangle = new google.maps.Rectangle({
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(rectangle.south, rectangle.west),
            new google.maps.LatLng(rectangle.north, rectangle.east)
          ),
          clickable: true,
          fillColor: getColorForValue(thresholds, rectangle.value),
          fillOpacity: 0.6,
          map: map,
          strokeWeight: 0,
        });

        google.maps.event.addListener(newRectangle, "click", () => {
          dispatch(setVisibility(false));

          const rectangleBounds = newRectangle.getBounds();

          if (rectangleBounds) {
            const rectangleBoundEast = rectangleBounds.getNorthEast().lng();
            const rectangleBoundWest = rectangleBounds.getSouthWest().lng();
            const rectangleBoundNorth = rectangleBounds.getNorthEast().lat();
            const rectangleBoundSouth = rectangleBounds.getSouthWest().lat();

            const rectangleFilters = {
              west: rectangleBoundWest.toString(),
              east: rectangleBoundEast.toString(),
              south: rectangleBoundSouth.toString(),
              north: rectangleBoundNorth.toString(),
              time_from: "1685318400",
              time_to: "1717027199",
              grid_size_x: "50",
              grid_size_y: "50",
              tags: tags || "",
              usernames: usernames || "",
              sensor_name: "airbeam-pm2.5",
              measurement_type: "Particulate Matter",
              unit_symbol: encodeURIComponent(unitSymbol),
              stream_ids: mobileSessionsStreamIds.join(","),
            };
            const queryString = new URLSearchParams(
              rectangleFilters
            ).toString();

            dispatch(fetchRectangleData(queryString));

            setSelectedRectangle(newRectangle);

            // Assume you have a way to get cluster data here, setting cluster data and position.
            setClusterPosition({ top: 100, left: 100 }); // Example position
            setClusterData({
              average: 10, // Example data
              numberOfContributors: 5,
              numberOfSamples: 20,
              numberOfInstruments: 3,
            });
            setClusterLoading(false);
            setClusterVisible(true);
          }
        });

        return newRectangle;
      });

      rectanglesRef.current.push(...newRectangles);
    }

    // Cleanup function to remove rectangles on unmount
    return () => {
      rectanglesRef.current.forEach((rectangle) => rectangle.setMap(null));
      rectanglesRef.current = [];
    };
  }, [
    crowdMapRectangles,
    map,
    thresholds,
    dispatch,
    measurementType,
    mobileSessionsStreamIds,
    tags,
    unitSymbol,
    usernames,
  ]);

  const renderMarker = (displayedSession: Session) => {
    return (
      <AdvancedMarker
        position={displayedSession.point}
        key={displayedSession.point.streamId}
      >
        <SessionDotMarker
          color={getColorForValue(
            thresholds,
            displayedSession.lastMeasurementValue
          )}
          onClick={() => {}}
          opacity={0.6}
        />
      </AdvancedMarker>
    );
  };

  return (
    <>
      {displayedSession && renderMarker(displayedSession)}
      {selectedRectangle &&
        clusterPosition &&
        !clusterLoading &&
        clusterData && (
          <ClusterInfo
            color={getColorForValue(thresholds, clusterData.average)}
            average={clusterData.average}
            numberOfSessions={clusterData.numberOfInstruments}
            handleZoomIn={() => {}}
            position={clusterPosition}
            visible={clusterVisible}
          />
        )}
    </>
  );
};

export { CrowdMapMarkers };

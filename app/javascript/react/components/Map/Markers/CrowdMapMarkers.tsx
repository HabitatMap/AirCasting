import React, { useEffect, useMemo, useRef, useState } from "react";

import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import {
  clearCrowdMap,
  fetchCrowdMapData,
  selectCrowdMapRectangles,
  selectFetchingCrowdMapData,
} from "../../../store/crowdMapSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectMobileSessionsLoading } from "../../../store/loadingSelectors";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { selectMobileSessionsStreamIds } from "../../../store/mobileSessionsSelectors";
import {
  clearRectangles,
  fetchRectangleData,
  RectangleData,
  selectRectangleData,
  selectRectangleLoading,
} from "../../../store/rectangleSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import useMapEventListeners from "../../../utils/mapEventListeners";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import {
  RectangleInfo,
  RectangleInfoLoading,
} from "./RectangleInfo/RectangleInfo";
import { SessionDotMarker } from "./SessionDotMarker/SessionDotMarker";

type Props = {
  pulsatingSessionId: number | null;
  sessions: Session[];
};

const CrowdMapMarkers = ({ pulsatingSessionId, sessions }: Props) => {
  const dispatch = useAppDispatch();

  const crowdMapRectangles = useAppSelector(selectCrowdMapRectangles);
  const fetchingCrowdMapData = useAppSelector(selectFetchingCrowdMapData);
  const mobileSessionsLoading = useAppSelector(selectMobileSessionsLoading);
  const mobileSessionsStreamIds = useAppSelector(selectMobileSessionsStreamIds);
  const rectangleData = useAppSelector(selectRectangleData);
  const rectangleLoading = useAppSelector(selectRectangleLoading);
  const thresholds = useAppSelector(selectThresholds);

  const map = useMap();
  const {
    boundEast,
    boundNorth,
    boundSouth,
    boundWest,
    gridSize,
    measurementType,
    sensorName,
    tags,
    timeFrom,
    timeTo,
    unitSymbol,
    usernames,
  } = useMapParams();

  const preparedUnitSymbol = unitSymbol.replace(/"/g, "");
  const encodedUnitSymbol = encodeURIComponent(preparedUnitSymbol);

  const gridSizeX = (x: number) => {
    const width =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;

    const height =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight;

    return (Math.round(x) * width) / height;
  };

  const filters = useMemo(
    () =>
      JSON.stringify({
        east: boundEast,
        grid_size_x: gridSizeX(gridSize),
        grid_size_y: gridSize,
        measurement_type: measurementType,
        north: boundNorth,
        sensor_name: sensorName,
        south: boundSouth,
        stream_ids: mobileSessionsStreamIds,
        tags: tags,
        time_from: timeFrom,
        time_to: timeTo,
        unit_symbol: encodedUnitSymbol,
        usernames: usernames,
        west: boundWest,
      }),
    [
      boundEast,
      boundNorth,
      boundSouth,
      boundWest,
      gridSize,
      measurementType,
      mobileSessionsStreamIds,
      sensorName,
      tags,
      timeFrom,
      timeTo,
      unitSymbol,
      usernames,
    ]
  );

  const rectanglesRef = useRef<google.maps.Rectangle[]>([]);
  const [rectanglePoint, setRectanglePoint] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const crowdMapRectanglesLength: number = crowdMapRectangles.length;
  const displayedSession: Session | undefined = sessions.find(
    (session) => session.id === pulsatingSessionId
  );

  useEffect(() => {
    dispatch(setMarkersLoading(true));
  }, [crowdMapRectanglesLength, tags, usernames, dispatch]);

  useEffect(() => {
    if (rectanglesRef.current.length >= crowdMapRectanglesLength) {
      dispatch(setMarkersLoading(false));
    }
  }, [crowdMapRectanglesLength, dispatch, rectanglesRef.current.length]);

  useEffect(() => {
    if (!mobileSessionsLoading || fetchingCrowdMapData) {
      setRectanglePoint(null);
      dispatch(setMarkersLoading(true));
      dispatch(clearCrowdMap());
      dispatch(fetchCrowdMapData(filters));
    }
  }, [dispatch, fetchingCrowdMapData, filters, mobileSessionsLoading]);

  useEffect(() => {
    if (!mobileSessionsLoading && crowdMapRectanglesLength > 0) {
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
              time_from: timeFrom,
              time_to: timeTo,
              grid_size_x: gridSizeX(gridSize).toString(),
              grid_size_y: gridSize.toString(),
              tags: tags || "",
              usernames: usernames || "",
              sensor_name: sensorName,
              measurement_type: measurementType,
              unit_symbol: encodeURIComponent(unitSymbol),
              stream_ids: mobileSessionsStreamIds.join(","),
            };
            const queryString = new URLSearchParams(
              rectangleFilters
            ).toString();

            dispatch(fetchRectangleData(queryString));
            setRectanglePoint({
              lat: rectangleBoundNorth,
              lng: rectangleBoundEast,
            });
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
    dispatch,
    gridSize,
    map,
    measurementType,
    mobileSessionsLoading,
    mobileSessionsStreamIds,
    sensorName,
    tags,
    thresholds,
    timeFrom,
    timeTo,
    unitSymbol,
    usernames,
  ]);

  useEffect(() => {
    map && map.addListener("zoom_changed", () => dispatch(clearRectangles()));
  }, [dispatch, map]);

  useMapEventListeners(map, {
    click: () => dispatch(clearRectangles()),
    touchend: () => dispatch(clearRectangles()),
    dragstart: () => dispatch(clearRectangles()),
  });

  const renderMarker = (displayedSession: Session) => {
    return (
      <AdvancedMarker
        position={displayedSession.point}
        key={displayedSession.point.streamId}
        zIndex={10}
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

  const renderInfo = (
    rectangleData: RectangleData | undefined,
    rectangleLoading: boolean
  ) => {
    return (
      <AdvancedMarker position={rectanglePoint} zIndex={20}>
        {rectangleData && !rectangleLoading && (
          <RectangleInfo
            color={getColorForValue(thresholds, rectangleData.average)}
            rectangleData={rectangleData}
          />
        )}
        {rectangleLoading && <RectangleInfoLoading />}
      </AdvancedMarker>
    );
  };

  return (
    <>
      {displayedSession && renderMarker(displayedSession)}
      {rectanglePoint && renderInfo(rectangleData, rectangleLoading)}
    </>
  );
};

export { CrowdMapMarkers };

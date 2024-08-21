import React, { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { Cluster, Marker, MarkerClusterer } from "@googlemaps/markerclusterer";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import { useAppDispatch } from "../../../store/hooks";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { SessionFullMarker } from "./SessionFullMarker/SessionFullMarker";

type Props = {
  sessions: Session[];
};

interface CustomMarkerClusterer extends MarkerClusterer {
  markerStreamIdMap?: Map<Marker, string>;
}

const TimelapseMarkers = ({ sessions }: Props) => {
  const ZOOM_FOR_SELECTED_SESSION = 15;

  const map = useMap();
  const dispatch = useAppDispatch();

  const clusterer = useRef<CustomMarkerClusterer | null>(null);
  const markerRefs = useRef<{
    [streamId: string]: google.maps.marker.AdvancedMarkerElement | null;
  }>({});
  const pulsatingClusterer = useRef<MarkerClusterer | null>(null);

  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useMapParams();

  const [markers, setMarkers] = useState<{
    [streamId: string]: google.maps.marker.AdvancedMarkerElement | null;
  }>({});
  const markersCount = Object.values(markers).filter(
    (marker) => marker !== null
  ).length;

  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterPosition, setClusterPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const memoizedSessions = useMemo(() => sessions, [sessions]);
  const memoizedMarkers = useMemo(() => markers, [markers]);

  // useEffect(() => {
  //   if (map) {
  //     if (clusterer.current) {
  //       clusterer.current.clearMarkers();
  //     }
  //     clusterer.current = new MarkerClusterer({
  //       map,
  //       renderer: customRenderer(thresholds),
  //       algorithm: new SuperClusterAlgorithm({
  //         maxZoom: 21,
  //         radius: 40,
  //       }),
  //     }) as CustomMarkerClusterer;
  //   }
  // }, [map, thresholds]);

  // const updateClusterer = useCallback(() => {
  //   if (clusterer.current && memoizedSessions.length > 0) {
  //     const sessionStreamIds = memoizedSessions.map(
  //       (session) => session.point.streamId
  //     );
  //     const markerStreamIdMap = new Map<Marker, string>();

  //     Object.keys(memoizedMarkers).forEach((key) => {
  //       if (!sessionStreamIds.includes(key)) {
  //         delete memoizedMarkers[key];
  //       }
  //     });

  //     const validMarkers = Object.values(memoizedMarkers).filter(
  //       (marker): marker is google.maps.marker.AdvancedMarkerElement =>
  //         marker !== null
  //     );

  //     validMarkers.forEach((marker) => {
  //       const streamId = sessionStreamIds.find(
  //         (id) => memoizedMarkers[id] === marker
  //       );
  //       if (streamId) {
  //         markerStreamIdMap.set(marker, streamId);
  //       }
  //     });

  //     clusterer.current.clearMarkers();
  //     clusterer.current.addMarkers(validMarkers);
  //     clusterer.current.markerStreamIdMap = markerStreamIdMap;
  //   }
  // }, [memoizedSessions, memoizedMarkers, dispatch]);

  // useEffect(() => {
  //   updateClusterer();
  // }, [updateClusterer]);

  // // useEffect(() => {
  // //   dispatch(setMarkersLoading(true));
  // // }, [dispatch, sessions.length]);

  // const setMarkerRef = useCallback(
  //   (marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
  //     if (markerRefs.current[key] === marker) return;

  //     markerRefs.current[key] = marker;
  //     setMarkers((prev) => {
  //       if (marker) {
  //         return { ...prev, [key]: marker };
  //       } else {
  //         const newMarkers = { ...prev };
  //         delete newMarkers[key];
  //         return newMarkers;
  //       }
  //     });
  //   },
  //   []
  // );

  return (
    <>
      {memoizedSessions.map((session) => (
        <AdvancedMarker
          position={session.point}
          key={session.point.streamId}
          zIndex={Number(google.maps.Marker.MAX_ZINDEX + 1)}
          title={session.lastMeasurementValue.toString()}
          // ref={(marker) => {
          //   if (marker && clusterer.current) {
          //     setMarkerRef(marker, session.point.streamId);
          //     clusterer.current.addMarker(marker);
          //   }
          // }}
        >
          <SessionFullMarker
            color={getColorForValue(thresholds, session.lastMeasurementValue)}
            value={`${Math.round(session.lastMeasurementValue)} ${unitSymbol}`}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

export { TimelapseMarkers };

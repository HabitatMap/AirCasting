import React, { useEffect, useMemo, useState } from "react";

import { Cluster } from "@googlemaps/markerclusterer";
import { Marker, useMap } from "@vis.gl/react-google-maps";

import { RootState } from "../../../store";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { useMapParams } from "../../../utils/mapParamsHandler";

import {
  selectFixedStreamData,
  selectFixedStreamStatus,
} from "../../../store/fixedStreamSelectors";
import { StatusEnum } from "../../../types/api";
import type { LatLngLiteral } from "../../../types/googleMaps";

type Props = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

// interface CustomMarkerClusterer extends MarkerClusterer {
//   markerStreamIdMap?: Map<Marker, string>;
// }

const FixedMarkers = ({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
}: Props) => {
  const ZOOM_FOR_SELECTED_SESSION = 15;

  const dispatch = useAppDispatch();
  const clusterData = useAppSelector((state: RootState) => state.cluster.data);
  const fixedStreamData = useAppSelector(selectFixedStreamData);
  const clusterLoading = useAppSelector(
    (state: RootState) => state.cluster.loading
  );
  const clusterVisible = useAppSelector(
    (state: RootState) => state.cluster.visible
  );
  // const hoverStreamId = useAppSelector(selectHoverStreamId);
  const thresholds = useAppSelector(selectThresholds);
  const fixedStreamStatus = useAppSelector(selectFixedStreamStatus);

  const map = useMap();
  const { unitSymbol } = useMapParams();

  // const clusterer = useRef<CustomMarkerClusterer | null>(null);
  // const markerRefs = useRef<{
  //   [streamId: string]: google.maps.marker.AdvancedMarkerElement | null;
  // }>({});
  // const pulsatingClusterer = useRef<MarkerClusterer | null>(null);

  const [clusterPosition, setClusterPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );
  const [markers, setMarkers] = useState<{
    [streamId: string]: google.maps.marker.AdvancedMarkerElement | null;
  }>({});
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [visibleMarkers, setVisibleMarkers] = useState<Set<string>>(new Set());

  const memoizedSessions = useMemo(() => sessions, [sessions]);
  const memoizedMarkers = useMemo(() => markers, [markers]);

  const markersCount = Object.values(markers).filter(
    (marker) => marker !== null
  ).length;

  // const centerMapOnMarker = useCallback(
  //   (position: LatLngLiteral) => {
  //     if (map && selectedStreamId) {
  //       map.setCenter(position);
  //       map.setZoom(ZOOM_FOR_SELECTED_SESSION);
  //     }
  //   },
  //   [map, selectedStreamId]
  // );

  // const handleBoundsChanged = useCallback(() => {
  //   if (selectedCluster && map) {
  //     const pixelPosition = getClusterPixelPosition(
  //       map,
  //       selectedCluster.position
  //     );
  //     setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
  //   }
  // }, [map, selectedCluster]);

  // const handleClusterClick = useCallback(
  //   async (
  //     event: google.maps.MapMouseEvent,
  //     cluster: Cluster,
  //     map: google.maps.Map
  //   ) => {
  //     dispatch(setVisibility(false));

  //     const markerStreamIdMap = clusterer.current?.markerStreamIdMap;

  //     const streamIds =
  //       cluster.markers &&
  //       cluster.markers
  //         .map((marker: Marker) => markerStreamIdMap?.get(marker))
  //         .filter((streamId) => streamId !== undefined);

  //     if (streamIds && streamIds.length > 0) {
  //       dispatch(fetchClusterData(streamIds as string[]));
  //     }

  //     const pixelPosition = getClusterPixelPosition(map, cluster.position);
  //     setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
  //     setSelectedCluster(cluster);
  //     dispatch(setVisibility(true));
  //   },
  //   [dispatch]
  // );

  // const clusterElementsRef = useRef<
  //   Map<Cluster, google.maps.marker.AdvancedMarkerElement>
  // >(new Map());

  // const handleThresholdChange = useCallback(() => {
  //   if (clusterElementsRef.current.size > 0) {
  //     clusterElementsRef.current.forEach((clusterElement, cluster) => {
  //       updateClusterStyle(
  //         clusterElement,
  //         cluster.markers as google.maps.marker.AdvancedMarkerElement[],
  //         thresholds,
  //         selectedStreamId
  //       );
  //     });
  //   }
  // }, [thresholds]);

  // useEffect(() => {
  //   handleThresholdChange();
  // }, [thresholds, handleThresholdChange]);

  // const handleMapInteraction = useCallback(() => {
  //   dispatch(setVisibility(false));
  //   setSelectedCluster(null);
  //   setClusterPosition(null);
  // }, [dispatch]);

  // const handleZoomIn = useCallback(() => {
  //   if (map && selectedCluster) {
  //     defaultOnClusterClickHandler(
  //       { stop: () => {} } as google.maps.MapMouseEvent,
  //       selectedCluster,
  //       map
  //     );
  //     const currentZoom = map.getZoom();
  //     if (currentZoom !== null && currentZoom !== undefined) {
  //       map.setZoom(currentZoom - 0.5);
  //     }
  //     handleMapInteraction();
  //   }
  // }, [map, selectedCluster]);

  // const setMarkerRef = useCallback(
  //   (marker: google.maps.Marker | null, key: string) => {
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

  useEffect(() => {
    if (selectedStreamId) {
      setVisibleMarkers(new Set([`marker-${selectedStreamId}`]));
    } else {
      setVisibleMarkers(
        new Set(
          memoizedSessions.map((session) => `marker-${session.point.streamId}`)
        )
      );
    }
  }, [selectedStreamId, memoizedSessions]);

  // useEffect(() => {
  //   return () => {
  //     if (clusterer.current) {
  //       clusterer.current.clearMarkers();
  //     }
  //     if (pulsatingClusterer.current) {
  //       pulsatingClusterer.current.clearMarkers();
  //     }
  //   };
  // }, []);

  useEffect(() => {
    const handleSelectedStreamId = (streamId: number | null) => {
      if (!streamId || fixedStreamStatus === StatusEnum.Pending) return;
      const { latitude, longitude } = fixedStreamData.stream;

      // if (latitude && longitude) {
      //   const fixedStreamPosition = { lat: latitude, lng: longitude };
      //   centerMapOnMarker(fixedStreamPosition);
      // } else {
      //   console.error(
      //     `Stream ID ${streamId} not found or missing latitude/longitude in fixedStream data.`
      //   );
      // }
    };

    handleSelectedStreamId(selectedStreamId);
  }, [selectedStreamId, fixedStreamData, fixedStreamStatus]);

  // useEffect(() => {
  //   dispatch(setMarkersLoading(true));
  // }, [dispatch, sessions.length]);

  // useEffect(() => {
  //   if (hoverStreamId) {
  //     const hoveredSession = memoizedSessions.find(
  //       (session) => Number(session.point.streamId) === hoverStreamId
  //     );
  //     if (hoveredSession) {
  //       setHoverPosition(hoveredSession.point);
  //     }
  //   } else {
  //     setHoverPosition(null);
  //   }
  // }, [hoverStreamId, memoizedSessions]);

  // useEffect(() => {
  //   if (markersCount >= sessions.length) {
  //     dispatch(setMarkersLoading(false));
  //   }
  // }, [dispatch, markersCount, sessions.length]);

  // useEffect(() => {
  //   if (pulsatingSessionId) {
  //     const pulsatingSession = memoizedSessions.find(
  //       (session) => session.id === pulsatingSessionId
  //     );
  //     const pulsatingSessionStreamId = pulsatingSession?.point.streamId;
  //     if (pulsatingSessionStreamId && clusterer.current) {
  //       const pulsatingCluster: Cluster | undefined =
  //         //@ts-expect-error
  //         clusterer.current.clusters.find(
  //           (cluster: Cluster) =>
  //             cluster.markers &&
  //             cluster.markers.some(
  //               (clusterMarker: Marker) =>
  //                 clusterMarker === memoizedMarkers[pulsatingSessionStreamId]
  //             )
  //         );

  //       if (
  //         pulsatingCluster &&
  //         pulsatingCluster.markers &&
  //         pulsatingCluster.markers.length > 1
  //       ) {
  //         if (pulsatingClusterer.current) {
  //           pulsatingClusterer.current.clearMarkers();
  //         }
  //         pulsatingClusterer.current = new MarkerClusterer({
  //           map,
  //           renderer: pulsatingRenderer(thresholds, pulsatingCluster.position),
  //           markers: pulsatingCluster.markers,
  //           algorithm: new GridAlgorithm({ gridSize: 1000 }),
  //         });
  //       }
  //     }
  //   } else {
  //     if (pulsatingClusterer.current) {
  //       pulsatingClusterer.current.clearMarkers();
  //       pulsatingClusterer.current = null;
  //     }
  //   }
  // }, [pulsatingSessionId, memoizedMarkers, memoizedSessions, thresholds]);

  // useEffect(() => {
  //   updateClusterer();
  // }, [updateClusterer]);

  // useEffect(() => {
  //   if (map && memoizedSessions.length > 0) {
  //     if (!clusterer.current) {
  //       clusterer.current = new MarkerClusterer({
  //         map,
  //         renderer: customRenderer(
  //           thresholds,
  //           clusterElementsRef,
  //           selectedStreamId
  //         ),
  //         algorithm: new SuperClusterAlgorithm({
  //           maxZoom: 21,
  //           radius: 40,
  //         }),
  //         onClusterClick: handleClusterClick,
  //       }) as CustomMarkerClusterer;
  //     } else {
  //       updateClusterer();
  //     }
  //   }
  // }, [map, memoizedSessions, updateClusterer]);

  // useEffect(() => {
  //   map && map.addListener("zoom_changed", handleMapInteraction);
  // }, [map, selectedCluster, dispatch, clusterer.current]);

  // useMapEventListeners(map, {
  //   click: () => {
  //     handleMapInteraction();
  //   },
  //   touchend: () => {
  //     handleMapInteraction();
  //   },
  //   dragstart: () => {
  //     handleMapInteraction();
  //   },
  //   bounds_changed: () => {
  //     handleBoundsChanged();
  //   },
  // });

  return (
    <>
      {memoizedSessions.map((session) => {
        const { point, lastMeasurementValue, id } = session;
        const { streamId } = point; // Ensure point has these properties

        return (
          <Marker
            key={streamId}
            position={{ lat: point.lat, lng: point.lng }} // Ensure the point has lat/lng
            zIndex={Number(google.maps.Marker.MAX_ZINDEX + 1)}
            title={lastMeasurementValue.toString()}
            onClick={() => {
              onMarkerClick(Number(streamId), Number(id)); // Handling marker click
            }}
          />
        );
      })}
    </>
  );
};

export { FixedMarkers };

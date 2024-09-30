import {
  Cluster,
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { useMap } from "@vis.gl/react-google-maps";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { green, orange, red, yellow } from "../../../assets/styles/colors";
import { fetchClusterData, setVisibility } from "../../../store/clusterSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import type { LatLngLiteral } from "../../../types/googleMaps";
import { Session } from "../../../types/sessionType";
import { getClusterPixelPosition } from "../../../utils/getClusterPixelPosition";
import useMapEventListeners from "../../../utils/mapEventListeners";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { ClusterInfo } from "./ClusterInfo/ClusterInfo";
import HoverMarker from "./HoverMarker/HoverMarker";
import { createClusterIcon, createMarkerIcon } from "./createMarkerIcon";

type Props = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

const FixedMarkers: React.FC<Props> = ({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
}) => {
  const ZOOM_FOR_SELECTED_SESSION = 15;
  const CLUSTER_RADIUS = 40;

  const dispatch = useAppDispatch();
  const hoverStreamId = useAppSelector(selectHoverStreamId);
  const thresholds = useAppSelector(selectThresholds);
  const map = useMap();
  const { unitSymbol } = useMapParams();
  const clusterData = useAppSelector((state) => state.cluster.data);
  const clusterVisible = useAppSelector((state) => state.cluster.visible);

  const markerRefs = useRef<Map<string, google.maps.Marker>>(new Map());
  const clusterer = useRef<MarkerClusterer | null>(null);

  const [visibleMarkers, setVisibleMarkers] = useState<google.maps.Marker[]>(
    []
  );
  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterPosition, setClusterPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const memoizedSessions = useMemo(() => sessions, [sessions]);

  const centerMapOnMarker = useCallback(
    (position: LatLngLiteral) => {
      if (map) {
        map.panTo(position);
        map.setZoom(ZOOM_FOR_SELECTED_SESSION);
      }
    },
    [map]
  );

  const handleClusterClick = useCallback(
    async (cluster: Cluster, map: google.maps.Map) => {
      dispatch(setVisibility(false));

      const markerStreamIds =
        cluster.markers?.map((marker) =>
          (marker as google.maps.Marker).getTitle()
        ) ?? [];

      if (markerStreamIds.length > 0) {
        const validIds = markerStreamIds.filter(
          (id): id is string => id != null
        );
        if (validIds.length > 0) {
          await dispatch(fetchClusterData(validIds));
        }
      }

      const pixelPosition = getClusterPixelPosition(map, cluster.position);
      setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
      setSelectedCluster(cluster);
      dispatch(setVisibility(true));
    },
    [dispatch]
  );

  const calculateClusterStyleIndex = useCallback(
    (markers: google.maps.Marker[]): number => {
      const sum = markers.reduce(
        (acc, marker) => acc + Number(marker.get("value") || 0),
        0
      );
      const average = sum / markers.length;

      if (average < thresholds.low) return 0;
      if (average <= thresholds.middle) return 1;
      if (average <= thresholds.high) return 2;
      return 3;
    },
    [thresholds]
  );

  const customRenderer = useMemo(
    () => ({
      render: ({ count, position, markers }: Cluster) => {
        const styleIndex = calculateClusterStyleIndex(
          markers as google.maps.Marker[]
        );
        const color = [green, yellow, orange, red][styleIndex];

        const hasPulsatingSession =
          markers && markers.length > 0
            ? markers.some((marker) => {
                const googleMarker = marker as google.maps.Marker;
                const sessionId =
                  (googleMarker.get("sessionId") as number) || null;
                return sessionId === pulsatingSessionId;
              })
            : false;

        const clusterIcon = createClusterIcon(color, hasPulsatingSession);

        return new google.maps.Marker({
          position,
          icon: clusterIcon,
          zIndex: 3,
        });
      },
    }),
    [thresholds, pulsatingSessionId, calculateClusterStyleIndex]
  );

  const memoizedCreateMarker = useCallback(
    (session: Session) => {
      const marker = new google.maps.Marker({
        position: session.point,
        icon: createMarkerIcon(
          getColorForValue(thresholds, session.lastMeasurementValue),
          `${Math.round(session.lastMeasurementValue)} ${unitSymbol}`,
          session.point.streamId === selectedStreamId?.toString(),
          session.id === pulsatingSessionId
        ),
        title: session.point.streamId,
      });

      marker.set("value", session.lastMeasurementValue);
      marker.set("sessionId", session.id);
      marker.addListener("click", () => {
        onMarkerClick(Number(session.point.streamId), Number(session.id));
        centerMapOnMarker(session.point);
      });

      return marker;
    },
    [
      thresholds,
      unitSymbol,
      selectedStreamId,
      pulsatingSessionId,
      onMarkerClick,
      centerMapOnMarker,
    ]
  );

  const updateVisibleMarkers = useCallback(() => {
    if (!map || !clusterer.current) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const newVisibleMarkers = memoizedSessions
      .filter((session) => bounds.contains(session.point))
      .map((session) => {
        if (!markerRefs.current.has(session.point.streamId)) {
          const marker = memoizedCreateMarker(session);
          markerRefs.current.set(session.point.streamId, marker);
        }
        return markerRefs.current.get(session.point.streamId)!;
      });

    setVisibleMarkers(newVisibleMarkers);

    // Add markers to the clusterer
    if (clusterer.current) {
      clusterer.current.clearMarkers();
      clusterer.current.addMarkers(newVisibleMarkers);
    }
  }, [map, memoizedSessions, memoizedCreateMarker]);

  useEffect(() => {
    if (map && !clusterer.current) {
      clusterer.current = new MarkerClusterer({
        map,
        renderer: customRenderer,
        algorithm: new SuperClusterAlgorithm({
          maxZoom: 21,
          radius: CLUSTER_RADIUS,
        }),
      });

      google.maps.event.addListener(
        clusterer.current,
        "click",
        (cluster: Cluster) => {
          handleClusterClick(cluster, map);
        }
      );

      updateVisibleMarkers();
    }
  }, [map, customRenderer, handleClusterClick, updateVisibleMarkers]);

  const handleMapInteraction = useCallback(() => {
    dispatch(setVisibility(false));
    setSelectedCluster(null);
    setClusterPosition(null);
  }, [dispatch]);

  const handleBoundsChanged = useCallback(() => {
    if (selectedCluster && map) {
      const pixelPosition = getClusterPixelPosition(
        map,
        selectedCluster.position
      );
      setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
    }
  }, [map, selectedCluster]);

  useMapEventListeners(map, {
    click: handleMapInteraction,
    touchend: handleMapInteraction,
    dragstart: handleMapInteraction,
    bounds_changed: handleBoundsChanged,
  });

  // Directly update marker icons when thresholds change
  useEffect(() => {
    visibleMarkers.forEach((marker) => {
      const value = marker.get("value");
      marker.setIcon(
        createMarkerIcon(
          getColorForValue(thresholds, value),
          `${Math.round(value)} ${unitSymbol}`,
          marker.getTitle() === selectedStreamId?.toString(),
          marker.get("sessionId") === pulsatingSessionId
        )
      );
    });
  }, [
    thresholds,
    unitSymbol,
    visibleMarkers,
    pulsatingSessionId,
    selectedStreamId,
  ]);

  // Handle hover logic for displaying markers
  useEffect(() => {
    if (hoverStreamId) {
      const hoveredSession = memoizedSessions.find(
        (session) => Number(session.point.streamId) === hoverStreamId
      );
      if (hoveredSession) {
        setHoverPosition(hoveredSession.point);
      }
    } else {
      setHoverPosition(null);
    }
  }, [hoverStreamId, memoizedSessions]);

  // Hide the loading spinner when all markers are loaded
  useEffect(() => {
    if (markerRefs.current.size >= sessions.length) {
      dispatch(setMarkersLoading(false));
    }
  }, [dispatch, sessions.length]);

  const handleZoomIn = useCallback(() => {
    if (map && selectedCluster) {
      const currentZoom = map.getZoom();
      if (currentZoom !== null && currentZoom !== undefined) {
        map.setZoom(currentZoom - 0.5);
      }
      handleMapInteraction();
    }
  }, [map, selectedCluster, handleMapInteraction]);

  return (
    <>
      {hoverPosition && <HoverMarker position={hoverPosition} />}
      {selectedCluster && clusterPosition && clusterVisible && clusterData && (
        <ClusterInfo
          color={getColorForValue(thresholds, clusterData.average)}
          average={clusterData.average}
          numberOfSessions={clusterData.numberOfInstruments}
          handleZoomIn={handleZoomIn}
          position={clusterPosition}
          visible={clusterVisible}
        />
      )}
    </>
  );
};

export { FixedMarkers };

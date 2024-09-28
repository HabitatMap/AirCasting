"use client";

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
import GreenCluster from "../../../assets/icons/markers/marker-cluster-green.svg";
import OrangeCluster from "../../../assets/icons/markers/marker-cluster-orange.svg";
import RedCluster from "../../../assets/icons/markers/marker-cluster-red.svg";
import YellowCluster from "../../../assets/icons/markers/marker-cluster-yellow.svg";
import { fetchClusterData, setVisibility } from "../../../store/clusterSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import type { LatLngLiteral } from "../../../types/googleMaps";
import { Session } from "../../../types/sessionType";
import { getClusterPixelPosition } from "../../../utils/getClusterPixelPosition";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { ClusterInfo } from "./ClusterInfo/ClusterInfo";
import HoverMarker from "./HoverMarker/HoverMarker";
import { createMarkerIcon } from "./createMarkerIcon";

type Props = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

interface ExtendedCluster extends Cluster {
  count: number;
}

const clusterStyles = [
  { url: GreenCluster, height: 30, width: 30, textSize: 12 },
  { url: YellowCluster, height: 30, width: 30, textSize: 12 },
  { url: OrangeCluster, height: 30, width: 30, textSize: 12 },
  { url: RedCluster, height: 30, width: 30, textSize: 12 },
];

const FixedMarkers: React.FC<Props> = ({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
}) => {
  const ZOOM_FOR_SELECTED_SESSION = 15;

  const dispatch = useAppDispatch();
  const hoverStreamId = useAppSelector(selectHoverStreamId);
  const thresholds = useAppSelector(selectThresholds);
  const map = useMap();
  const { unitSymbol } = useMapParams();
  const clusterData = useAppSelector((state) => state.cluster.data);
  const clusterLoading = useAppSelector((state) => state.cluster.loading);
  const clusterVisible = useAppSelector((state) => state.cluster.visible);

  const clusterer = useRef<MarkerClusterer | null>(null);
  const markerRefs = useRef<Map<string, google.maps.Marker>>(new Map());

  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );
  const [selectedCluster, setSelectedCluster] =
    useState<ExtendedCluster | null>(null);
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
    (event: google.maps.MapMouseEvent, cluster: ExtendedCluster) => {
      if (!map) return;

      dispatch(setVisibility(false));
      const markerStreamIds =
        cluster.markers?.map((marker) =>
          (marker as google.maps.Marker).getTitle()
        ) ?? [];
      if (markerStreamIds.length > 0) {
        const validIds = markerStreamIds.filter(
          (id): id is string => id != null
        );
        dispatch(fetchClusterData(validIds));
      }

      const pixelPosition = getClusterPixelPosition(map, cluster.position);
      setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
      setSelectedCluster(cluster);
      dispatch(setVisibility(true));
    },
    [dispatch, map]
  );

  const calculateClusterStyleIndex = useCallback(
    (markers: google.maps.Marker[]): number => {
      const sum = markers.reduce((acc, marker) => {
        return acc + Number(marker.get("value") || 0);
      }, 0);
      const average = sum / markers.length;

      if (average < thresholds.low) return 0;
      if (average <= thresholds.middle) return 1;
      if (average <= thresholds.high) return 2;
      return 3;
    },
    [thresholds]
  );

  const customRenderer = useCallback(
    ({ count, position, markers }: ExtendedCluster) => {
      const styleIndex = calculateClusterStyleIndex(
        markers as google.maps.Marker[]
      );
      const { url, height, width, textSize } = clusterStyles[styleIndex];

      const clusterElement = new google.maps.Marker({
        position,
        icon: {
          url: url,
          scaledSize: new google.maps.Size(width, height),
        },
        label: {
          text: count.toString(),
          color: "white",
          fontSize: `${textSize}px`,
        },
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
      });

      return clusterElement;
    },
    [calculateClusterStyleIndex]
  );

  // Update only when necessary
  const updateMarkers = useCallback(() => {
    if (map && memoizedSessions.length > 0) {
      if (!clusterer.current) {
        clusterer.current = new MarkerClusterer({
          map,
          algorithm: new SuperClusterAlgorithm({ radius: 60, maxZoom: 16 }),
          renderer: {
            render: (cluster) => customRenderer(cluster as ExtendedCluster),
          },
        });

        clusterer.current.addListener(
          "clusterclick",
          (event: google.maps.MapMouseEvent, cluster: ExtendedCluster) =>
            handleClusterClick(event, cluster as ExtendedCluster)
        );
      }

      const newMarkers: google.maps.Marker[] = [];

      memoizedSessions.forEach((session) => {
        // Avoid recreating markers if they already exist
        if (!markerRefs.current.has(session.point.streamId)) {
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
          marker.addListener("click", () => {
            onMarkerClick(Number(session.point.streamId), Number(session.id));
            centerMapOnMarker(session.point);
          });

          markerRefs.current.set(session.point.streamId, marker);
          newMarkers.push(marker);
        }
      });

      if (newMarkers.length > 0) {
        clusterer.current.addMarkers(newMarkers);
      }
    }
  }, [
    map,
    memoizedSessions,
    thresholds,
    unitSymbol,
    selectedStreamId,
    pulsatingSessionId,
    onMarkerClick,
    centerMapOnMarker,
    customRenderer,
    handleClusterClick,
  ]);

  // Only re-render markers if sessions change
  useEffect(() => {
    updateMarkers();
    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current.clear();
      if (clusterer.current) {
        clusterer.current.clearMarkers();
      }
    };
  }, [map, memoizedSessions.length]);

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

  useEffect(() => {
    if (markerRefs.current.size >= sessions.length) {
      dispatch(setMarkersLoading(false));
    }
  }, [dispatch, sessions.length]);

  return (
    <>
      {hoverPosition && <HoverMarker position={hoverPosition} />}
      {selectedCluster && clusterPosition && !clusterLoading && clusterData && (
        <ClusterInfo
          color={getColorForValue(thresholds, clusterData.average)}
          average={clusterData.average}
          numberOfSessions={clusterData.numberOfInstruments}
          handleZoomIn={() => {
            const currentZoom = map?.getZoom();
            if (currentZoom !== undefined && map) {
              map.setZoom(currentZoom + 1);
              map.panTo(selectedCluster.position);
            }
          }}
          position={clusterPosition}
          visible={clusterVisible}
        />
      )}
    </>
  );
};

export { FixedMarkers };

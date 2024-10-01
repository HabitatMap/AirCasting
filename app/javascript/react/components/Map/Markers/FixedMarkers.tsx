// FixedMarkers.tsx

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
import { fetchClusterData, setVisibility } from "../../../store/clusterSlice";
import {
  selectFixedStreamData,
  selectFixedStreamStatus,
} from "../../../store/fixedStreamSelectors";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { StatusEnum } from "../../../types/api";
import { CustomMarker, LatLngLiteral } from "../../../types/googleMaps";
import { Session } from "../../../types/sessionType";
import { getClusterPixelPosition } from "../../../utils/getClusterPixelPosition";
import useMapEventListeners from "../../../utils/mapEventListeners";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { createFixedMarkersRenderer } from "./ClusterConfiguration";
import { ClusterInfo } from "./ClusterInfo/ClusterInfo";
import { createClusterIcon, createMarkerIcon } from "./createMarkerIcon";
import HoverMarker from "./HoverMarker/HoverMarker";

type FixedMarkersProps = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
  onClusterClick?: (clusterData: any) => void;
};

export function FixedMarkers({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
  onClusterClick,
}: FixedMarkersProps) {
  const ZOOM_FOR_SELECTED_SESSION = 15;
  const CLUSTER_RADIUS = 40;

  const dispatch = useAppDispatch();
  const hoverStreamId = useAppSelector(selectHoverStreamId);
  const thresholds = useAppSelector(selectThresholds);
  const map = useMap();
  const { unitSymbol } = useMapParams();
  const clusterData = useAppSelector((state) => state.cluster.data);
  const fixedStreamData = useAppSelector(selectFixedStreamData);
  const fixedStreamStatus = useAppSelector(selectFixedStreamStatus);
  const clusterVisible = useAppSelector((state) => state.cluster.visible);

  // Store individual marker references
  const markerRefs = useRef<Map<string, google.maps.Marker>>(new Map());

  // Store cluster marker references
  const clusterElementsRef = useRef<Map<Cluster, google.maps.Marker>>(
    new Map()
  );

  // **Define `clusterer` using `useRef`**
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
  const [isMapInitialized, setIsMapInitialized] = useState(false);

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

  const handleClusterClickInternal = useCallback(
    async (event: google.maps.MapMouseEvent, cluster: Cluster) => {
      event.stop();
      dispatch(setVisibility(false));

      const markerStreamIds =
        cluster.markers?.map((marker) =>
          (marker as CustomMarker).get("title")
        ) ?? [];
      if (markerStreamIds.length > 0) {
        const validIds = markerStreamIds.filter(
          (id): id is string => id != null
        );
        if (validIds.length > 0) {
          await dispatch(fetchClusterData(validIds));
        }
      }

      const pixelPosition = getClusterPixelPosition(map!, cluster.position);
      setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
      setSelectedCluster(cluster);
      dispatch(setVisibility(true));

      if (onClusterClick) {
        onClusterClick(cluster);
      }
    },
    [dispatch, map, onClusterClick]
  );

  const updateClusterStyle = useCallback(
    (
      clusterMarker: google.maps.Marker,
      markers: google.maps.Marker[],
      thresholds: any,
      selectedStreamId: number | null
    ) => {
      const values = markers.map((marker) => Number(marker.get("value") || 0));
      const average =
        values.reduce((sum, value) => sum + value, 0) / values.length;
      const color = getColorForValue(thresholds, average);

      // Create a new icon based on the updated color
      const newIcon = createClusterIcon(color, false); // Assuming no pulsating for simplicity

      clusterMarker.setIcon(newIcon);
    },
    []
  );

  const handleThresholdChange = useCallback(() => {
    // Update cluster marker styles
    if (clusterElementsRef.current.size > 0) {
      clusterElementsRef.current.forEach((clusterMarker, cluster) => {
        const markers = cluster.markers as google.maps.Marker[];
        updateClusterStyle(
          clusterMarker,
          markers,
          thresholds,
          selectedStreamId
        );
      });
    }

    // Update individual marker icons
    markerRefs.current.forEach((marker, streamId) => {
      const value = marker.get("value");
      const newIcon = createMarkerIcon(
        getColorForValue(thresholds, value),
        `${Math.round(value)} ${unitSymbol}`,
        marker.get("title") === selectedStreamId?.toString(),
        marker.get("sessionId") === pulsatingSessionId
      );
      marker.setIcon(newIcon);
    });
  }, [
    thresholds,
    selectedStreamId,
    updateClusterStyle,
    unitSymbol,
    pulsatingSessionId,
  ]);

  const customRenderer = useMemo(
    () =>
      createFixedMarkersRenderer({
        thresholds,
        pulsatingSessionId,
        updateClusterStyle,
        clusterElementsRef,
      }),
    [thresholds, pulsatingSessionId, updateClusterStyle]
  );

  const memoizedCreateMarker = useCallback(
    (session: Session): google.maps.Marker => {
      const marker = new google.maps.Marker({
        position: session.point,
        icon: createMarkerIcon(
          getColorForValue(thresholds, session.lastMeasurementValue),
          `${Math.round(session.lastMeasurementValue)} ${unitSymbol}`,
          session.point.streamId === selectedStreamId?.toString(),
          session.id === pulsatingSessionId
        ),
        zIndex: Number(google.maps.Marker.MAX_ZINDEX + 1),
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

    const allMarkers = memoizedSessions.map((session) => {
      if (!markerRefs.current.has(session.point.streamId)) {
        const marker = memoizedCreateMarker(session);
        markerRefs.current.set(session.point.streamId, marker);
      }
      return markerRefs.current.get(session.point.streamId)!;
    });

    setVisibleMarkers(allMarkers);

    // **Do NOT clear clusterElementsRef here**
    // Remove existing cluster markers if necessary
    // clusterElementsRef.current.forEach((clusterMarker) => {
    //   clusterMarker.setMap(null);
    // });
    // clusterElementsRef.current.clear();

    // Clear and add markers via MarkerClusterer
    if (clusterer.current) {
      clusterer.current.clearMarkers();
      clusterer.current.addMarkers(allMarkers);
    }

    if (!isMapInitialized) {
      const bounds = new google.maps.LatLngBounds();
      allMarkers.forEach((marker) => {
        if (marker instanceof google.maps.Marker) {
          const position = marker.getPosition();
          if (position) {
            bounds.extend(position.toJSON());
          }
        }
      });

      google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        const currentZoom = map.getZoom();
        if (currentZoom !== undefined && currentZoom > 2) {
          map.setZoom(currentZoom - 1);
        }
      });

      setIsMapInitialized(true);
    }
  }, [map, memoizedSessions, memoizedCreateMarker, isMapInitialized]);

  useEffect(() => {
    if (map && !clusterer.current) {
      clusterer.current = new MarkerClusterer({
        map,
        renderer: customRenderer,
        algorithm: new SuperClusterAlgorithm({
          maxZoom: 21,
          radius: CLUSTER_RADIUS,
        }),
        onClusterClick: handleClusterClickInternal,
      });

      setTimeout(() => {
        updateVisibleMarkers();
      }, 100);
    }
  }, [map, customRenderer, handleClusterClickInternal, updateVisibleMarkers]);

  // **Trigger cluster and marker style update when thresholds change**
  useEffect(() => {
    handleThresholdChange();
  }, [handleThresholdChange]);

  useEffect(() => {
    const handleSelectedStreamId = (streamId: number | null) => {
      if (!streamId || fixedStreamStatus === StatusEnum.Pending) return;
      const { latitude, longitude } = fixedStreamData.stream;

      if (latitude && longitude) {
        const fixedStreamPosition = { lat: latitude, lng: longitude };
        centerMapOnMarker(fixedStreamPosition);
      } else {
        console.error(
          `Stream ID ${streamId} not found or missing latitude/longitude in fixedStream data.`
        );
      }
    };

    handleSelectedStreamId(selectedStreamId);
  }, [selectedStreamId, fixedStreamData, fixedStreamStatus, centerMapOnMarker]);

  useEffect(() => {
    visibleMarkers.forEach((marker) => {
      const value = marker.get("value");
      const newIcon = createMarkerIcon(
        getColorForValue(thresholds, value),
        `${Math.round(value)} ${unitSymbol}`,
        marker.get("title") === selectedStreamId?.toString(),
        marker.get("sessionId") === pulsatingSessionId
      );
      marker.setIcon(newIcon);
    });
  }, [
    thresholds,
    unitSymbol,
    visibleMarkers,
    pulsatingSessionId,
    selectedStreamId,
  ]);

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

  const handleZoomIn = useCallback(() => {
    if (map && selectedCluster) {
      const bounds = new google.maps.LatLngBounds();

      selectedCluster.markers?.forEach((marker) => {
        if (marker instanceof google.maps.Marker) {
          const position = marker.getPosition();
          if (position) {
            bounds.extend(position.toJSON());
          }
        }
      });

      map.fitBounds(bounds);
      map.panToBounds(bounds);

      google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        const currentZoom = map.getZoom();
        if (currentZoom !== undefined) {
          map.setZoom(Math.max(currentZoom - 1, 0));
        }
      });

      handleMapInteraction();
      setSelectedCluster(null);
      dispatch(setVisibility(false));
    }
  }, [map, selectedCluster, handleMapInteraction, dispatch]);

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
}

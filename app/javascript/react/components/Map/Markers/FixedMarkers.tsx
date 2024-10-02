"use client";

import {
  Cluster,
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { useMap } from "@vis.gl/react-google-maps";
import { debounce } from "lodash";
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
import { LatLngLiteral } from "../../../types/googleMaps";
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

const MemoizedHoverMarker = React.memo(HoverMarker);
const MemoizedClusterInfo = React.memo(ClusterInfo);

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

  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markerRefs = useRef<Map<string, google.maps.Marker>>(new Map());
  const clusterElementsRef = useRef<Map<Cluster, google.maps.Marker>>(
    new Map()
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

  const handleClusterClickInternal = useCallback(
    async (event: google.maps.MapMouseEvent, cluster: Cluster) => {
      event.stop();
      dispatch(setVisibility(false));
      const markerStreamIds =
        cluster.markers
          ?.map((marker) => {
            const userData = (marker as any).userData;
            return userData ? userData.streamId : null;
          })
          .filter(
            (id): id is string => typeof id === "string" && id.length > 0
          ) ?? [];

      if (markerStreamIds.length > 0) {
        await dispatch(fetchClusterData(markerStreamIds));
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
      const values = markers.map((marker) =>
        Number((marker as any).value || 0)
      );
      const average =
        values.reduce((sum, value) => sum + value, 0) / values.length;
      const color = getColorForValue(thresholds, average);

      const newIcon = createClusterIcon(color, false);

      clusterMarker.setIcon(newIcon);
    },
    []
  );

  const handleThresholdChange = useCallback(() => {
    if (clusterElementsRef.current.size > 0) {
      clusterElementsRef.current.forEach((clusterMarker, cluster) => {
        const markers =
          cluster.markers?.map((marker) => marker as google.maps.Marker) ?? [];
        updateClusterStyle(
          clusterMarker,
          markers,
          thresholds,
          selectedStreamId
        );
      });
    }

    markerRefs.current.forEach((marker, streamId) => {
      const value = (marker as any).value;
      const newIcon = createMarkerIcon(
        getColorForValue(thresholds, value),
        `${Math.round(value)} ${unitSymbol}`,
        marker.getTitle() === selectedStreamId?.toString(),
        (marker as any).sessionId === pulsatingSessionId
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

  const createMarker = useCallback(
    (session: Session): google.maps.Marker => {
      const marker = new google.maps.Marker({
        position: session.point,
        icon: createMarkerIcon(
          getColorForValue(thresholds, session.lastMeasurementValue),
          `${Math.round(session.lastMeasurementValue)} ${unitSymbol}`,
          session.point.streamId === selectedStreamId?.toString(),
          session.id === pulsatingSessionId
        ),
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + 1,
        title: session.point.streamId,
      });

      (marker as any).value = session.lastMeasurementValue;
      (marker as any).sessionId = session.id;
      (marker as any).userData = { streamId: session.point.streamId };

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

  useEffect(() => {
    if (map && !clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: [],
        renderer: customRenderer,
        algorithm: new SuperClusterAlgorithm({
          maxZoom: 21,
          radius: CLUSTER_RADIUS,
        }),
        onClusterClick: handleClusterClickInternal,
      });
    }
  }, [map, customRenderer, handleClusterClickInternal]);

  useEffect(() => {
    if (!map || !clustererRef.current) return;

    const updatedMarkers: google.maps.Marker[] = [];
    const markersToRemove: google.maps.Marker[] = [];

    sessions.forEach((session) => {
      let marker = markerRefs.current.get(session.point.streamId);
      if (!marker) {
        marker = createMarker(session);
        markerRefs.current.set(session.point.streamId, marker);
        updatedMarkers.push(marker);
      } else {
        // Update existing marker
        const newIcon = createMarkerIcon(
          getColorForValue(thresholds, session.lastMeasurementValue),
          `${Math.round(session.lastMeasurementValue)} ${unitSymbol}`,
          session.point.streamId === selectedStreamId?.toString(),
          session.id === pulsatingSessionId
        );
        marker.setIcon(newIcon);
        marker.setPosition(session.point);
        (marker as any).value = session.lastMeasurementValue;
        (marker as any).sessionId = session.id;
      }
    });

    // Identify markers to remove
    markerRefs.current.forEach((marker, streamId) => {
      if (!sessions.some((session) => session.point.streamId === streamId)) {
        markersToRemove.push(marker);
        markerRefs.current.delete(streamId);
      }
    });

    // Remove markers no longer in the sessions array
    if (markersToRemove.length > 0) {
      clustererRef.current.removeMarkers(markersToRemove);
      markersToRemove.forEach((marker) => marker.setMap(null));
    }

    // Add new markers
    if (updatedMarkers.length > 0) {
      clustererRef.current.addMarkers(updatedMarkers);
    }

    // Force clusterer update
    clustererRef.current.render();
  }, [
    sessions,
    map,
    createMarker,
    thresholds,
    unitSymbol,
    selectedStreamId,
    pulsatingSessionId,
  ]);

  useEffect(() => {
    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current.setMap(null);
        clustererRef.current = null;
      }
      markerRefs.current.forEach((marker) => {
        marker.setMap(null);
      });
      markerRefs.current.clear();
      clusterElementsRef.current.forEach((clusterMarker) => {
        clusterMarker.setMap(null);
      });
      clusterElementsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    handleThresholdChange();
  }, [handleThresholdChange]);

  useEffect(() => {
    const handleSelectedStreamId = (streamId: number | null) => {
      if (!streamId || fixedStreamStatus === StatusEnum.Pending) return;
      const { latitude, longitude } = fixedStreamData?.stream ?? {};

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

  const debouncedHandleMapInteraction = useMemo(
    () => debounce(handleMapInteraction, 100),
    [handleMapInteraction]
  );

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
    click: debouncedHandleMapInteraction,
    touchend: debouncedHandleMapInteraction,
    dragstart: debouncedHandleMapInteraction,
    bounds_changed: handleBoundsChanged,
  });

  const handleZoomIn = useCallback(() => {
    if (map && selectedCluster) {
      const bounds = new google.maps.LatLngBounds();

      selectedCluster.markers?.forEach((marker) => {
        const position =
          "getPosition" in marker ? marker.getPosition() : marker.position;
        if (position) {
          bounds.extend(position);
        }
      });

      map.fitBounds(bounds);
      map.panToBounds(bounds);

      google.maps.event.addListenerOnce(map, "idle", () => {
        const currentZoom = map.getZoom();
        if (currentZoom !== undefined) {
          map.setZoom(Math.max(currentZoom - 5, 0));
        }
      });

      handleMapInteraction();
      setSelectedCluster(null);
      dispatch(setVisibility(false));
    }
  }, [map, selectedCluster, handleMapInteraction, dispatch]);

  return (
    <>
      {hoverPosition && <MemoizedHoverMarker position={hoverPosition} />}
      {selectedCluster && clusterPosition && clusterVisible && clusterData && (
        <MemoizedClusterInfo
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

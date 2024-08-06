import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";

import {
  Cluster,
  defaultOnClusterClickHandler,
  GridAlgorithm,
  Marker,
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import { RootState } from "../../../store";
import { fetchClusterData, setVisibility } from "../../../store/clusterSlice";
import { useAppDispatch } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { getClusterPixelPosition } from "../../../utils/getClusterPixelPosition";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { customRenderer, pulsatingRenderer } from "./ClusterConfiguration";
import { ClusterInfo } from "./ClusterInfo/ClusterInfo";
import HoverMarker from "./HoverMarker/HoverMarker";
import { SessionFullMarker } from "./SessionFullMarker/SessionFullMarker";

import type { LatLngLiteral } from "../../../types/googleMaps";
type Props = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

interface CustomMarkerClusterer extends MarkerClusterer {
  markerStreamIdMap?: Map<Marker, string>;
}

const FixedMarkers = ({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
}: Props) => {
  const ZOOM_FOR_SELECTED_SESSION = 15;

  const map = useMap();
  const dispatch = useAppDispatch();
  const { currentCenter } = useMapParams();

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

  const hoverStreamId = useSelector(selectHoverStreamId);
  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );

  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterPosition, setClusterPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const clusterData = useSelector((state: RootState) => state.cluster.data);
  const clusterLoading = useSelector(
    (state: RootState) => state.cluster.loading
  );
  const clusterVisible = useSelector(
    (state: RootState) => state.cluster.visible
  );

  const memoizedSessions = useMemo(() => sessions, [sessions]);
  const memoizedMarkers = useMemo(() => markers, [markers]);

  useEffect(() => {
    if (map) {
      if (clusterer.current) {
        clusterer.current.clearMarkers();
      }
      clusterer.current = new MarkerClusterer({
        map,
        renderer: customRenderer(thresholds),
        algorithm: new SuperClusterAlgorithm({
          maxZoom: 21,
          radius: 40,
        }),
        onClusterClick: handleClusterClick,
      }) as CustomMarkerClusterer;
    }
  }, [map, thresholds]);

  useEffect(() => {
    if (selectedStreamId) {
      const s = sessions.find(
        (session) => session?.point?.streamId === selectedStreamId?.toString()
      );
      if (s?.point) {
        centerMapOnMarker(s.point, s.point.streamId);
      }
    }
  }, [sessions]);

  const updateClusterer = useCallback(() => {
    if (clusterer.current && memoizedSessions.length > 0) {
      const sessionStreamIds = memoizedSessions.map(
        (session) => session.point.streamId
      );
      const markerStreamIdMap = new Map<Marker, string>();

      Object.keys(memoizedMarkers).forEach((key) => {
        if (!sessionStreamIds.includes(key)) {
          delete memoizedMarkers[key];
        }
      });

      const validMarkers = Object.values(memoizedMarkers).filter(
        (marker): marker is google.maps.marker.AdvancedMarkerElement =>
          marker !== null
      );

      validMarkers.forEach((marker) => {
        const streamId = sessionStreamIds.find(
          (id) => memoizedMarkers[id] === marker
        );
        if (streamId) {
          markerStreamIdMap.set(marker, streamId);
        }
      });

      clusterer.current.clearMarkers();
      clusterer.current.addMarkers(validMarkers);
      clusterer.current.markerStreamIdMap = markerStreamIdMap;
    }
  }, [memoizedSessions, memoizedMarkers]);

  useEffect(() => {
    updateClusterer();
  }, [updateClusterer]);

  useEffect(() => {
    if (pulsatingSessionId) {
      const pulsatingSession = memoizedSessions.find(
        (session) => session.id === pulsatingSessionId
      );
      const pulsatingSessionStreamId = pulsatingSession?.point.streamId;
      if (pulsatingSessionStreamId && clusterer.current) {
        const pulsatingCluster: Cluster | undefined =
          //@ts-expect-error
          clusterer.current.clusters.find(
            (cluster: Cluster) =>
              cluster.markers &&
              cluster.markers.some(
                (clusterMarker: Marker) =>
                  clusterMarker === memoizedMarkers[pulsatingSessionStreamId]
              )
          );

        if (
          pulsatingCluster &&
          pulsatingCluster.markers &&
          pulsatingCluster.markers.length > 1
        ) {
          if (pulsatingClusterer.current) {
            pulsatingClusterer.current.clearMarkers();
          }
          pulsatingClusterer.current = new MarkerClusterer({
            map,
            renderer: pulsatingRenderer(thresholds, pulsatingCluster.position),
            markers: pulsatingCluster.markers,
            algorithm: new GridAlgorithm({ gridSize: 1000 }),
          });
        }
      }
    } else {
      if (pulsatingClusterer.current) {
        pulsatingClusterer.current.clearMarkers();
        pulsatingClusterer.current = null;
      }
    }
  }, [pulsatingSessionId, memoizedMarkers, memoizedSessions, thresholds]);

  useEffect(() => {
    return () => {
      if (clusterer.current) {
        clusterer.current.clearMarkers();
      }
      if (pulsatingClusterer.current) {
        pulsatingClusterer.current.clearMarkers();
      }
    };
  }, []);

  const centerMapOnMarker = useCallback(
    (position: LatLngLiteral, streamId: string) => {
      if (map && selectedStreamId) {
        map.setCenter(position);
        map.setZoom(ZOOM_FOR_SELECTED_SESSION);
      }
    },
    [map, selectedStreamId]
  );

  const setMarkerRef = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
      if (markerRefs.current[key] === marker) return;

      markerRefs.current[key] = marker;
      setMarkers((prev) => {
        if (marker) {
          return { ...prev, [key]: marker };
        } else {
          const newMarkers = { ...prev };
          delete newMarkers[key];
          return newMarkers;
        }
      });
    },
    []
  );

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

  const handleClusterClick = useCallback(
    async (
      event: google.maps.MapMouseEvent,
      cluster: Cluster,
      map: google.maps.Map
    ) => {
      dispatch(setVisibility(false));

      const markerStreamIdMap = clusterer.current?.markerStreamIdMap;

      const streamIds =
        cluster.markers &&
        cluster.markers
          .map((marker: Marker) => markerStreamIdMap?.get(marker))
          .filter((streamId) => streamId !== undefined);

      if (streamIds && streamIds.length > 0) {
        dispatch(fetchClusterData(streamIds as string[]));
      }

      //!IMPORTANT! This is a current fix for the url params updating the center of the map incorrectly on first render after pasting a copied link, once the main issue is fixed, we can get rid of this ugly hack
      // const mapCenter = map.getCenter();
      // if (mapCenter !== currentCenter) {
      //   mapCenter && map && map.setCenter(mapCenter);
      // }

      const pixelPosition = getClusterPixelPosition(map, cluster.position);
      setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
      setSelectedCluster(cluster);
      dispatch(setVisibility(true));
    },
    [dispatch]
  );

  const handleZoomIn = useCallback(() => {
    if (map && selectedCluster) {
      defaultOnClusterClickHandler(
        { stop: () => {} } as google.maps.MapMouseEvent,
        selectedCluster,
        map
      );
      const currentZoom = map.getZoom();
      if (currentZoom !== null && currentZoom !== undefined) {
        map.setZoom(currentZoom - 0.5);
      }
      dispatch(setVisibility(false));
      setSelectedCluster(null);
      setClusterPosition(null);
    }
  }, [map, selectedCluster]);

  useEffect(() => {
    const handleMapInteraction = () => {
      dispatch(setVisibility(false));
      setSelectedCluster(null);
      setClusterPosition(null);
    };

    const handleBoundsChanged = () => {
      if (selectedCluster && map) {
        const pixelPosition = getClusterPixelPosition(
          map,
          selectedCluster.position
        );
        setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
      }
    };

    map && map.addListener("click", handleMapInteraction);
    map && map.addListener("touchend", handleMapInteraction);
    map && map.addListener("dragstart", handleMapInteraction);
    map && map.addListener("zoom_changed", handleMapInteraction);
    map && map.addListener("bounds_changed", handleBoundsChanged);

    return () => {
      if (map) {
        google.maps.event.clearListeners(map, "click");
        google.maps.event.clearListeners(map, "touchend");
        google.maps.event.clearListeners(map, "dragstart");
        google.maps.event.clearListeners(map, "bounds_changed");
      }
    };
  }, [map, selectedCluster, dispatch, clusterer.current]);

  return (
    <>
      {memoizedSessions.map((session) => (
        <AdvancedMarker
          position={session.point}
          key={session.point.streamId}
          zIndex={Number(google.maps.Marker.MAX_ZINDEX + 1)}
          title={session.lastMeasurementValue.toString()}
          ref={(marker) => {
            if (marker && clusterer.current) {
              setMarkerRef(marker, session.point.streamId);
              clusterer.current.addMarker(marker);
            }
          }}
        >
          <SessionFullMarker
            color={getColorForValue(thresholds, session.lastMeasurementValue)}
            value={`${Math.round(session.lastMeasurementValue)} ${unitSymbol}`}
            isSelected={session.point.streamId === selectedStreamId?.toString()}
            shouldPulse={session.id === pulsatingSessionId}
            onClick={() => {
              onMarkerClick(Number(session.point.streamId), Number(session.id));
              centerMapOnMarker(session.point, session.point.streamId);
            }}
          />
        </AdvancedMarker>
      ))}
      {hoverPosition && <HoverMarker position={hoverPosition} />}
      {selectedCluster && clusterPosition && !clusterLoading && clusterData && (
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

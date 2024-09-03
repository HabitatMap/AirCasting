import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import { setVisibility } from "../../../store/clusterSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { Session } from "../../../types/sessionType";
import useMapEventListeners from "../../../utils/mapEventListeners";
import HoverMarker from "./HoverMarker/HoverMarker";

import { gray300 } from "../../../assets/styles/colors";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import type { LatLngLiteral } from "../../../types/googleMaps";
import { SessionDotMarker } from "./SessionDotMarker/SessionDotMarker";

type Props = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

const DormantMarkers = ({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
}: Props) => {
  const ZOOM_FOR_SELECTED_SESSION = 15;

  const dispatch = useAppDispatch();
  const hoverStreamId = useAppSelector(selectHoverStreamId);

  const map = useMap();

  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );
  const [markers, setMarkers] = useState<{
    [streamId: string]: google.maps.marker.AdvancedMarkerElement | null;
  }>({});

  const memoizedSessions = useMemo(() => sessions, [sessions]);

  const markersCount = Object.values(markers).filter(
    (marker) => marker !== null
  ).length;
  const markerRefs = useRef<{
    [streamId: string]: google.maps.marker.AdvancedMarkerElement | null;
  }>({});

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

  const handleMapInteraction = useCallback(() => {
    dispatch(setVisibility(false));
  }, [dispatch]);

  useEffect(() => {
    if (selectedStreamId) {
      const s = sessions.find(
        (session) => session?.point?.streamId === selectedStreamId?.toString()
      );
      if (s?.point) {
        centerMapOnMarker(s.point, s.point.streamId);
      }
    }
  }, [sessions, selectedStreamId]);

  useEffect(() => {
    dispatch(setMarkersLoading(true));
  }, [dispatch, sessions.length]);

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
    if (markersCount >= sessions.length) {
      dispatch(setMarkersLoading(false));
    }
  }, [dispatch, markersCount, sessions.length]);

  useMapEventListeners(map, {
    click: () => {
      handleMapInteraction();
    },
    touchend: () => {
      handleMapInteraction();
    },
    dragstart: () => {
      handleMapInteraction();
    },
    zoom_changed: () => {
      handleMapInteraction();
    },
  });

  return (
    <>
      {memoizedSessions.map((session) => (
        <AdvancedMarker
          position={session.point}
          key={session.point.streamId}
          zIndex={1000}
          ref={(marker) => {
            if (marker) {
              setMarkerRef(marker, session.point.streamId);
            }
          }}
        >
          <SessionDotMarker
            color={gray300}
            onClick={() => {
              onMarkerClick(Number(session.point.streamId), Number(session.id));
              centerMapOnMarker(session.point, session.point.streamId);
            }}
            shouldPulse={session.id === pulsatingSessionId}
          />
        </AdvancedMarker>
      ))}
      {hoverPosition && <HoverMarker position={hoverPosition} />}
    </>
  );
};

export { DormantMarkers };

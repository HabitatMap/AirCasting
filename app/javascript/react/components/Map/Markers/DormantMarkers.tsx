"use client";

import { useMap } from "@vis.gl/react-google-maps";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gray300 } from "../../../assets/styles/colors";
import {
  selectFixedStreamData,
  selectFixedStreamStatus,
} from "../../../store/fixedStreamSelectors";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { StatusEnum } from "../../../types/api";
import type { LatLngLiteral } from "../../../types/googleMaps";
import { Session } from "../../../types/sessionType";
import { CustomMarker } from "./CustomMarker";
import HoverMarker from "./HoverMarker/HoverMarker";

type DormantMarkersProps = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

const DormantMarkers: React.FC<DormantMarkersProps> = ({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
}) => {
  const ZOOM_FOR_SELECTED_SESSION = 15;

  const dispatch = useAppDispatch();
  const hoverStreamId = useAppSelector(selectHoverStreamId);
  const fixedStreamStatus = useAppSelector(selectFixedStreamStatus);
  const fixedStreamData = useAppSelector(selectFixedStreamData);
  const markerRefs = useRef<Map<string, CustomMarker>>(new Map());

  const map = useMap();

  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );

  const memoizedSessions = useMemo(() => sessions, [sessions]);

  const centerMapOnMarker = useCallback(
    (position: LatLngLiteral) => {
      if (map && selectedStreamId) {
        map.setCenter(position);
        map.setZoom(ZOOM_FOR_SELECTED_SESSION);
      }
    },
    [map, selectedStreamId]
  );

  const createMarker = useCallback(
    (session: Session): CustomMarker => {
      const position = session.point;
      const color = gray300;
      const title = "";
      const size = 12;
      const shouldPulse = session.id === pulsatingSessionId;

      const marker = new CustomMarker(
        position,
        color,
        title,
        size,
        undefined,
        () => {
          onMarkerClick(Number(session.point.streamId), Number(session.id));
          centerMapOnMarker(position);
        }
      );

      marker.setPulsating(shouldPulse);
      marker.setMap(map);

      return marker;
    },
    [map, onMarkerClick, centerMapOnMarker, pulsatingSessionId]
  );

  useEffect(() => {
    if (!map) return;

    sessions.forEach((session) => {
      const markerId = session.point.streamId;
      let marker = markerRefs.current.get(markerId);
      if (!marker) {
        marker = createMarker(session);
        markerRefs.current.set(markerId, marker);
      } else {
        marker.setPosition(session.point);
        marker.setPulsating(session.id === pulsatingSessionId);
      }
    });

    const sessionStreamIds = new Set(sessions.map((s) => s.point.streamId));
    markerRefs.current.forEach((marker, markerId) => {
      if (!sessionStreamIds.has(markerId)) {
        marker.setMap(null);
        markerRefs.current.delete(markerId);
      }
    });

    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current.clear();
    };
  }, [sessions, map, createMarker, pulsatingSessionId]);

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

  return hoverPosition ? <HoverMarker position={hoverPosition} /> : null;
};

export { DormantMarkers };

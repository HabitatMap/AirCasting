import { useMap } from "@vis.gl/react-google-maps";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";

import { mobileStreamPath } from "../../../assets/styles/colors";
import { useAppDispatch } from "../../../store/hooks";
import { selectHoverPosition } from "../../../store/mapSlice";
import {
  setMarkersLoading,
  setTotalMarkers,
} from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { getColorForValue } from "../../../utils/thresholdColors";
import HoverMarker from "./HoverMarker/HoverMarker";

type Props = {
  sessions: Session[];
  unitSymbol: string;
};

const StreamMarkers = ({ sessions, unitSymbol }: Props) => {
  const dispatch = useAppDispatch();
  const map = useMap();
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const thresholds = useSelector(selectThresholds);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const hoverPosition = useSelector(selectHoverPosition);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  // Memoize the sorted sessions and filter out invalid sessions
  const sortedSessions = useMemo(() => {
    return [...sessions]
      .filter(
        (session) =>
          session.point &&
          typeof session.point.lat === "number" &&
          typeof session.point.lng === "number"
      )
      .sort((a, b) => {
        const timeA = a.time ? new Date(a.time.toString()).getTime() : 0;
        const timeB = b.time ? new Date(b.time.toString()).getTime() : 0;
        return timeA - timeB;
      });
  }, [sessions]);

  // Handle idle event to end loading
  const handleIdle = useCallback(() => {
    dispatch(setMarkersLoading(false));
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, [dispatch]);

  // Create marker icon
  const createMarkerIcon = useCallback((color: string) => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 0,
      scale: 8,
    };
  }, []);

  // Create or update marker
  const createOrUpdateMarker = useCallback(
    (session: Session) => {
      const position = { lat: session.point.lat, lng: session.point.lng };
      const color = getColorForValue(thresholds, session.lastMeasurementValue);
      const markerId = session.id.toString();

      let marker = markersRef.current.get(markerId);

      if (!marker) {
        marker = new google.maps.Marker({
          position,
          icon: createMarkerIcon(color),
          title: `${session.lastMeasurementValue} ${unitSymbol}`,
          zIndex: 0,
          map: map,
        });
        markersRef.current.set(markerId, marker);
      } else {
        marker.setPosition(position);
        marker.setIcon(createMarkerIcon(color));
        marker.setTitle(`${session.lastMeasurementValue} ${unitSymbol}`);
      }

      return marker;
    },
    [map, thresholds, unitSymbol, createMarkerIcon]
  );

  /**
   * Effect 1: Handle changes in sessions (data)
   * - Manage markers loading state
   * - Add/remove/update markers
   * - Update polyline
   */
  useEffect(() => {
    if (!map) return;

    // Start loading
    dispatch(setMarkersLoading(true));
    dispatch(setTotalMarkers(sortedSessions.length));

    // Create the polyline path using sorted session coordinates
    const path = sortedSessions.map((session) => ({
      lat: session.point.lat,
      lng: session.point.lng,
    }));

    // Create or update the polyline
    if (polylineRef.current) {
      polylineRef.current.setPath(path);
    } else {
      polylineRef.current = new google.maps.Polyline({
        path: path,
        map,
        strokeColor: mobileStreamPath,
        strokeOpacity: 0.7,
        strokeWeight: 4,
      });
    }

    // Create or update markers
    const currentMarkerIds = new Set<string>();

    sortedSessions.forEach((session) => {
      const markerId = session.id.toString();
      createOrUpdateMarker(session);
      currentMarkerIds.add(markerId);
    });

    // Remove markers that are no longer needed
    markersRef.current.forEach((marker, markerId) => {
      if (!currentMarkerIds.has(markerId)) {
        marker.setMap(null);
        markersRef.current.delete(markerId);
      }
    });

    const idleListener = map.addListener("idle", handleIdle);

    // Set fallback timeout
    timeoutId.current = setTimeout(() => {
      dispatch(setMarkersLoading(false));
    }, 10000); // 10,000 ms = 10 seconds

    return () => {
      // Cleanup markers
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current.clear();

      // Cleanup polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }

      // Remove idle listener and clear timeout
      google.maps.event.removeListener(idleListener);
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }
    };
  }, [map, sortedSessions, dispatch, handleIdle, createOrUpdateMarker]);

  /**
   * Effect 2: Handle changes in thresholds
   * - Update marker icon's color based on new thresholds
   * - Do NOT affect loading state
   */
  useEffect(() => {
    markersRef.current.forEach((marker, markerId) => {
      const session = sortedSessions.find((s) => s.id.toString() === markerId);
      if (session) {
        const newColor = getColorForValue(
          thresholds,
          session.lastMeasurementValue
        );
        marker.setIcon(createMarkerIcon(newColor));
      }
    });
  }, [thresholds, sortedSessions, createMarkerIcon]);

  return hoverPosition ? <HoverMarker position={hoverPosition} /> : null;
};

export { StreamMarkers };

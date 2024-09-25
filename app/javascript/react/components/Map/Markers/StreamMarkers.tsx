import { useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useMemo, useRef } from "react";
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
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const thresholds = useSelector(selectThresholds);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const hoverPosition = useSelector(selectHoverPosition);

  // Memoize the sorted sessions
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const timeA = a.time ? new Date(a.time.toString()).getTime() : 0;
      const timeB = b.time ? new Date(b.time.toString()).getTime() : 0;
      return timeA - timeB;
    });
  }, [sessions]);

  /**
   * Effect 1: Handle changes in sessions (data)
   * - Manage markers loading state
   * - Add/remove markers
   * - Update polyline
   */
  useEffect(() => {
    if (!map) return;

    // Start loading
    dispatch(setMarkersLoading(true));
    dispatch(setTotalMarkers(sessions.length));

    // Remove existing markers
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];
    }

    // Create or update the polyline
    const path = sortedSessions.map((session) => ({
      lat: session.point.lat,
      lng: session.point.lng,
    }));

    if (polylineRef.current) {
      polylineRef.current.setPath(path);
    } else {
      polylineRef.current = new google.maps.Polyline({
        path,
        map,
        strokeColor: mobileStreamPath,
        strokeOpacity: 0.7,
        strokeWeight: 4,
      });
    }

    // Create markers
    const markers = sortedSessions.map((session) => {
      const position = { lat: session.point.lat, lng: session.point.lng };
      const color = getColorForValue(thresholds, session.lastMeasurementValue);

      // Create the element for the marker
      const markerElement = document.createElement("div");
      markerElement.style.width = "12px";
      markerElement.style.height = "12px";
      markerElement.style.borderRadius = "50%";
      markerElement.style.backgroundColor = color;
      markerElement.style.border = `1px solid ${color}`;

      // Center the marker content
      markerElement.style.position = "absolute";
      markerElement.style.transform = "translate(-50%, -50%)";

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        content: markerElement,
        title: `${session.lastMeasurementValue} ${unitSymbol}`,
        zIndex: 0,
        map: map,
      });

      return marker;
    });

    markersRef.current = markers;

    // Listener to detect when the map has finished rendering markers
    const handleIdle = () => {
      dispatch(setMarkersLoading(false));
      clearTimeout(timeoutId); // Clear the timeout if idle fires
    };

    // Add the idle event listener
    const idleListener = map.addListener("idle", handleIdle);

    // Fallback timeout (e.g., 10 seconds)
    const timeoutId = setTimeout(() => {
      dispatch(setMarkersLoading(false));
    }, 10000); // 10,000 ms = 10 seconds

    return () => {
      // Cleanup markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach((marker) => {
          marker.map = null;
        });
        markersRef.current = [];
      }

      // Cleanup polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }

      // Remove idle listener and clear timeout
      google.maps.event.removeListener(idleListener);
      clearTimeout(timeoutId);
    };
  }, [map, sortedSessions, unitSymbol, dispatch]);

  /**
   * Effect 2: Handle changes in thresholds
   * - Update marker colors based on new thresholds
   * - Do NOT affect loading state
   */
  useEffect(() => {
    if (!markersRef.current.length) return;

    markersRef.current.forEach((marker, index) => {
      const session = sortedSessions[index];
      if (!session) return;

      const color = getColorForValue(thresholds, session.lastMeasurementValue);
      const markerContent = marker.content;

      // Ensure the content is an HTMLElement before accessing its styles
      if (markerContent instanceof HTMLElement) {
        markerContent.style.backgroundColor = color;
        markerContent.style.border = `1px solid ${color}`;
      }
    });
  }, [thresholds, sortedSessions]);

  return hoverPosition ? <HoverMarker position={hoverPosition} /> : null;
};

export { StreamMarkers };

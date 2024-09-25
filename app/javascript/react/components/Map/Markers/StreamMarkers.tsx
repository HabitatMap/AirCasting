// StreamMarkers.tsx

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
import { createMarkerContent } from "../../../utils/createMarkerContent";
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
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  // Caching marker content to prevent redundant DOM creation
  const markerContentCache = useRef<{ [color: string]: HTMLElement }>({});

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

    // Create markers using custom SVG content
    const markers = sortedSessions.map((session, index) => {
      const position = { lat: session.point.lat, lng: session.point.lng };
      const color = getColorForValue(thresholds, session.lastMeasurementValue);

      let cachedContent = markerContentCache.current[color];
      if (!cachedContent) {
        cachedContent = createMarkerContent(color);
        markerContentCache.current[color] = cachedContent;
      }

      // Clone the cached HTMLElement to ensure uniqueness
      const markerContentClone = cachedContent.cloneNode(true) as HTMLElement;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        content: markerContentClone, // Assign the cloned HTMLElement
        title: `${session.lastMeasurementValue} ${unitSymbol}`,
        zIndex: 0,
        map: map,
      });

      return marker;
    });

    markersRef.current = markers;

    const idleListener = map.addListener("idle", handleIdle);

    // Set fallback timeout
    timeoutId.current = setTimeout(() => {
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
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }
    };
  }, [map, sortedSessions, unitSymbol, dispatch, sessions.length, handleIdle]);

  /**
   * Effect 2: Handle changes in thresholds
   * - Update marker content's color based on new thresholds
   * - Do NOT affect loading state
   */
  useEffect(() => {
    if (!markersRef.current.length) return;

    markersRef.current.forEach((marker, index) => {
      const session = sortedSessions[index];
      if (!session) return;

      const newColor = getColorForValue(
        thresholds,
        session.lastMeasurementValue
      );

      // Access the marker's content safely
      const markerContent = marker.content as HTMLElement | null;
      if (!markerContent) {
        console.warn(`Marker at index ${index} has no content.`);
        return;
      }

      const svg = markerContent.querySelector("svg");
      if (!svg) {
        console.warn(`Marker at index ${index} has no SVG element.`);
        return;
      }

      const circle = svg.querySelector("circle");
      if (!circle) {
        console.warn(`Marker at index ${index} has no circle element.`);
        return;
      }

      const currentFill = circle.getAttribute("fill");

      // Update the fill color only if it has changed
      if (currentFill !== newColor) {
        circle.setAttribute("fill", newColor);
      }
    });
  }, [thresholds, sortedSessions]);

  return hoverPosition ? <HoverMarker position={hoverPosition} /> : null;
};

export { StreamMarkers };

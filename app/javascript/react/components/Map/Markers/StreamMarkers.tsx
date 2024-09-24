import { useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useMemo, useRef } from "react";
import { acBlue, mobileStreamPath } from "../../../assets/styles/colors";
import { useAppSelector } from "../../../store/hooks";
import { selectHoverPosition } from "../../../store/mapSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { getColorForValue } from "../../../utils/thresholdColors";

type Props = {
  sessions: Session[];
  unitSymbol: string;
};

const StreamMarkers: React.FC<Props> = ({ sessions, unitSymbol }) => {
  const map = useMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const thresholds = useAppSelector(selectThresholds);
  const hoverPosition = useAppSelector(selectHoverPosition);
  const hoverMarkerRef = useRef<google.maps.Marker | null>(null);

  // Memoize the sorted sessions to prevent unnecessary recalculations
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const timeA = a.time ? new Date(a.time).getTime() : 0;
      const timeB = b.time ? new Date(b.time).getTime() : 0;
      return timeA - timeB;
    });
  }, [sessions]);

  useEffect(() => {
    if (!map || sortedSessions.length === 0) return;

    // Create or update the polyline
    const path = sortedSessions.map((session) => ({
      lat: session.point.lat,
      lng: session.point.lng,
    }));

    if (polylineRef.current) {
      // Update the existing polyline's path
      polylineRef.current.setPath(path);
    } else {
      // Create a new polyline
      polylineRef.current = new google.maps.Polyline({
        path,
        map,
        strokeColor: mobileStreamPath,
        strokeOpacity: 0.7, // Fully opaque
        strokeWeight: 3,
        zIndex: 1, // Ensure polyline is below markers
      });
    }

    // Remove existing markers to prevent duplicates
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current = [];
    }

    // Define a custom circle symbol centered at (0,0)
    const createCircleSymbol = (color: string) => ({
      path: "M0,0 m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0",
      fillColor: color,
      fillOpacity: 1,
      strokeColor: color,
      strokeWeight: 1,
      anchor: new google.maps.Point(0, 0),
      scale: 1,
    });

    // Create all markers at once
    sortedSessions.forEach((session) => {
      const color = getColorForValue(thresholds, session.lastMeasurementValue);
      const marker = new google.maps.Marker({
        position: { lat: session.point.lat, lng: session.point.lng },
        map,
        title: `${session.lastMeasurementValue} ${unitSymbol}`,
        zIndex: 3, // Ensure markers are above the polyline
        icon: createCircleSymbol(color),
        optimized: false, // Ensure proper rendering
      });

      markersRef.current.push(marker);
    });

    // Cleanup function to remove markers and polyline when the component unmounts
    return () => {
      // Remove markers from the map
      if (markersRef.current.length > 0) {
        markersRef.current.forEach((marker) => {
          google.maps.event.clearInstanceListeners(marker);
          marker.setMap(null);
        });
        markersRef.current = [];
      }

      // Remove polyline from the map
      if (polylineRef.current) {
        google.maps.event.clearInstanceListeners(polylineRef.current);
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, sortedSessions, unitSymbol, thresholds]);

  useEffect(() => {
    if (!map) return;

    if (hoverPosition && hoverPosition.lat !== 0 && hoverPosition.lng !== 0) {
      if (!hoverMarkerRef.current) {
        hoverMarkerRef.current = new google.maps.Marker({
          position: hoverPosition,
          map,
          zIndex: 4, // Ensure hover marker is above everything
          icon: {
            path: "M0,0 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0",
            fillColor: acBlue,
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: acBlue,
            anchor: new google.maps.Point(0, 0),
            scale: 1,
          },
          optimized: false,
        });
      } else {
        hoverMarkerRef.current.setPosition(hoverPosition);
      }
    } else {
      if (hoverMarkerRef.current) {
        hoverMarkerRef.current.setMap(null);
        hoverMarkerRef.current = null;
      }
    }

    return () => {
      if (hoverMarkerRef.current) {
        hoverMarkerRef.current.setMap(null);
        hoverMarkerRef.current = null;
      }
    };
  }, [map, hoverPosition]);

  return null;
};

export { StreamMarkers };

import { useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useMemo, useRef } from "react";
import { acBlue, mobileStreamPath } from "../../../assets/styles/colors";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverPosition } from "../../../store/mapSlice";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { getColorForValue } from "../../../utils/thresholdColors";

type Props = {
  sessions: Session[];
  unitSymbol: string;
};

const StreamMarkers: React.FC<Props> = ({ sessions, unitSymbol }) => {
  const map = useMap();
  const dispatch = useAppDispatch();
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
    if (!map) return;

    // Dispatch loading start
    dispatch(setMarkersLoading(true));

    // Clean up existing markers and polyline
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current = [];
    }

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (sortedSessions.length === 0) {
      // No sessions to display
      dispatch(setMarkersLoading(false));
      return;
    }

    // Create or update the polyline
    const path = sortedSessions.map((session) => ({
      lat: session.point.lat,
      lng: session.point.lng,
    }));

    polylineRef.current = new google.maps.Polyline({
      path,
      map,
      strokeColor: mobileStreamPath,
      strokeOpacity: 0.7, // Fully opaque
      strokeWeight: 4,
      zIndex: 1, // Ensure polyline is below markers
    });

    // Create custom marker icons
    const createMarkerIcon = (color: string) => {
      const size = 12; // Size of the icon in pixels
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
          <circle cx="${size / 2}" cy="${size / 2}" r="${
        size / 2
      }" fill="${color}" />
        </svg>
      `;
      return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        anchor: new google.maps.Point(size / 2, size / 2),
        scaledSize: new google.maps.Size(size, size),
      };
    };

    // Add markers to the map
    sortedSessions.forEach((session) => {
      const color = getColorForValue(thresholds, session.lastMeasurementValue);
      const marker = new google.maps.Marker({
        position: { lat: session.point.lat, lng: session.point.lng },
        map,
        title: `${session.lastMeasurementValue} ${unitSymbol}`,
        zIndex: 2, // Ensure markers are above the polyline
        icon: createMarkerIcon(color),
        optimized: false, // Ensure proper rendering
      });

      markersRef.current.push(marker);
    });

    // Listen for the 'tilesloaded' event
    const tilesLoadedListener = google.maps.event.addListenerOnce(
      map,
      "tilesloaded",
      () => {
        // Dispatch loading end when the map tiles and markers are loaded
        dispatch(setMarkersLoading(false));
      }
    );

    // Cleanup function
    return () => {
      // Remove markers from the map
      if (markersRef.current.length > 0) {
        markersRef.current.forEach((marker) => {
          marker.setMap(null);
        });
        markersRef.current = [];
      }

      // Remove polyline from the map
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }

      // Remove tilesloaded listener
      google.maps.event.removeListener(tilesLoadedListener);
    };
  }, [map, sortedSessions, unitSymbol, thresholds, dispatch]);

  useEffect(() => {
    if (!map) return;

    if (hoverPosition && hoverPosition.lat !== 0 && hoverPosition.lng !== 0) {
      if (!hoverMarkerRef.current) {
        const size = 16;
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
            <circle cx="${size / 2}" cy="${size / 2}" r="${
          size / 2
        }" fill="${acBlue}" />
          </svg>
        `;
        hoverMarkerRef.current = new google.maps.Marker({
          position: hoverPosition,
          map,
          zIndex: 3, // Ensure hover marker is above everything
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
            anchor: new google.maps.Point(size / 2, size / 2),
            scaledSize: new google.maps.Size(size, size),
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

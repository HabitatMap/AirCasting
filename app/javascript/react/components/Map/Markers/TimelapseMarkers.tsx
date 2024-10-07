import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectThresholds } from "../../../store/thresholdSlice";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { createClusterIcon, createMarkerIcon } from "./createMarkerIcon";

type SessionData = {
  value: number;
  latitude: number;
  longitude: number;
  sessions: number;
};

type Props = {
  sessions: SessionData[];
};

const calculateZIndex = (sessions: number): number => {
  return sessions === 1
    ? Number(google.maps.Marker.MAX_ZINDEX + 2)
    : Number(google.maps.Marker.MAX_ZINDEX + 1);
};

const TimelapseMarkers = ({ sessions }: Props) => {
  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useMapParams();
  const map = useMap();
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;

    const sessionsMap = new Map<string, SessionData>();
    sessions.forEach((session) => {
      const key = `${session.latitude}-${session.longitude}`;
      sessionsMap.set(key, session);
    });

    // Update existing markers and create new ones if necessary
    sessionsMap.forEach((session, key) => {
      let marker = markersRef.current.get(key);

      if (marker) {
        // Update existing marker
        const position = {
          lat: session.latitude,
          lng: session.longitude,
        };
        const color = getColorForValue(thresholds, session.value);
        let icon: google.maps.Icon;

        if (session.sessions === 1) {
          const valueText = `${Math.round(session.value)} ${unitSymbol}`;
          icon = createMarkerIcon(color, valueText, false, false);
        } else {
          icon = createClusterIcon(color, false);
        }

        marker.setPosition(position);
        marker.setIcon(icon);
        marker.setZIndex(calculateZIndex(session.sessions));
        marker.setTitle(session.value.toString());
      } else {
        // Create new marker
        const position = {
          lat: session.latitude,
          lng: session.longitude,
        };
        const color = getColorForValue(thresholds, session.value);
        let icon: google.maps.Icon;

        if (session.sessions === 1) {
          const valueText = `${Math.round(session.value)} ${unitSymbol}`;
          icon = createMarkerIcon(color, valueText, false, false);
        } else {
          icon = createClusterIcon(color, false);
        }

        marker = new google.maps.Marker({
          position,
          map,
          zIndex: calculateZIndex(session.sessions),
          title: session.value.toString(),
          icon,
        });

        markersRef.current.set(key, marker);
      }
    });

    // Remove markers that are no longer in the sessions array
    markersRef.current.forEach((marker, key) => {
      if (!sessionsMap.has(key)) {
        marker.setMap(null);
        markersRef.current.delete(key);
      }
    });
  }, [map, sessions, thresholds, unitSymbol]);

  // Cleanup markers when component unmounts
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current.clear();
    };
  }, []);

  return null;
};

export { TimelapseMarkers };

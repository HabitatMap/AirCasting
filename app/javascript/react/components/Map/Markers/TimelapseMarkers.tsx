// TimelapseMarkers.tsx

import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectThresholds } from "../../../store/thresholdSlice";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { LabelOverlay } from "./customMarkerLabel";
import { CustomMarkerOverlay } from "./customMarkerOverlay";

type SessionData = {
  value: number;
  latitude: number;
  longitude: number;
  sessions: number;
};

type Props = {
  sessions: SessionData[];
};

type TimelapseMarker = {
  markerOverlay: CustomMarkerOverlay;
  labelOverlay: LabelOverlay | null;
};

const calculateZIndex = (sessions: number): number => {
  return sessions === 1
    ? Number(google.maps.Marker.MAX_ZINDEX) + 2
    : Number(google.maps.Marker.MAX_ZINDEX) + 1;
};

const TimelapseMarkers = ({ sessions }: Props) => {
  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useMapParams();
  const map = useMap();
  const markersRef = useRef<Map<string, TimelapseMarker>>(new Map());

  useEffect(() => {
    if (!map) return;

    const sessionsMap = new Map<string, SessionData>();
    sessions.forEach((session) => {
      const key = `${session.latitude}-${session.longitude}`;
      sessionsMap.set(key, session);
    });

    // Update existing markers and create new ones if necessary
    sessionsMap.forEach((session, key) => {
      let timelapseMarker = markersRef.current.get(key);

      const position = new google.maps.LatLng(
        session.latitude,
        session.longitude
      );
      const color = getColorForValue(thresholds, session.value);
      const zIndex = calculateZIndex(session.sessions);
      const isSelected = false; // Timelapse markers are not selectable
      const shouldPulse = false; // Disable pulsating
      const isCluster = session.sessions > 1;

      if (timelapseMarker) {
        // Update existing marker overlay
        timelapseMarker.markerOverlay.setColor(color);
        timelapseMarker.markerOverlay.setPosition(position);
        timelapseMarker.markerOverlay.setZIndex(zIndex);
        timelapseMarker.markerOverlay.setIsCluster(isCluster);

        if (!isCluster) {
          // Update existing label overlay
          if (timelapseMarker.labelOverlay) {
            timelapseMarker.labelOverlay.update(
              isSelected,
              color,
              session.value,
              unitSymbol
            );
            timelapseMarker.labelOverlay.setPosition(position);
            timelapseMarker.labelOverlay.setZIndex(zIndex);
          } else {
            // Create label overlay if it doesn't exist
            const labelOverlay = new LabelOverlay(
              position,
              color,
              session.value,
              unitSymbol,
              isSelected,
              () => {},
              zIndex
            );
            labelOverlay.setMap(map);
            timelapseMarker.labelOverlay = labelOverlay;
          }
        } else {
          // Remove label overlay if sessions > 1
          if (timelapseMarker.labelOverlay) {
            timelapseMarker.labelOverlay.setMap(null);
            timelapseMarker.labelOverlay = null;
          }
        }
      } else {
        // Create new marker overlay
        const markerOverlay = new CustomMarkerOverlay(
          position,
          color,
          isSelected,
          shouldPulse,
          isCluster
        );
        markerOverlay.setZIndex(zIndex);
        markerOverlay.setMap(map);

        let labelOverlay: LabelOverlay | null = null;
        if (!isCluster) {
          // Create label overlay for single sessions
          labelOverlay = new LabelOverlay(
            position,
            color,
            session.value,
            unitSymbol,
            isSelected,
            () => {},
            zIndex
          );
          labelOverlay.setMap(map);
        }

        // Store both overlays in the markersRef
        markersRef.current.set(key, { markerOverlay, labelOverlay });
      }
    });

    // Remove markers that are no longer in the sessions array
    markersRef.current.forEach((timelapseMarker, key) => {
      if (!sessionsMap.has(key)) {
        timelapseMarker.markerOverlay.setMap(null);
        if (timelapseMarker.labelOverlay) {
          timelapseMarker.labelOverlay.setMap(null);
        }
        markersRef.current.delete(key);
      }
    });
  }, [map, sessions, thresholds, unitSymbol]);

  // Cleanup markers when component unmounts
  useEffect(() => {
    return () => {
      markersRef.current.forEach((timelapseMarker) => {
        timelapseMarker.markerOverlay.setMap(null);
        if (timelapseMarker.labelOverlay) {
          timelapseMarker.labelOverlay.setMap(null);
        }
      });
      markersRef.current.clear();
    };
  }, []);

  return null;
};

export { TimelapseMarkers };

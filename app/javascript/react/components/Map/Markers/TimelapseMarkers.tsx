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

// Define TimelapseMarker type to encapsulate both overlays
type TimelapseMarker = {
  markerOverlay: CustomMarkerOverlay;
  labelOverlay: LabelOverlay;
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
  const markersRef = useRef<Map<string, TimelapseMarker>>(new Map());

  useEffect(() => {
    if (!map) return;

    const sessionsMap = new Map<string, SessionData>();
    sessions.forEach((session) => {
      // Assuming each session has a unique identifier, use it as part of the key
      const key = `${session.latitude}-${session.longitude}-${session.value}`;
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

      if (timelapseMarker) {
        // Update existing marker overlay
        timelapseMarker.markerOverlay.setColor(color);
        timelapseMarker.markerOverlay.setPosition(position);
        timelapseMarker.markerOverlay.setZIndex(zIndex);
        timelapseMarker.markerOverlay.setIsSelected(isSelected);

        // Update existing label overlay
        timelapseMarker.labelOverlay.update(
          isSelected,
          color,
          session.value,
          unitSymbol
        );
        timelapseMarker.labelOverlay.setPosition(position);
        timelapseMarker.labelOverlay.setZIndex(zIndex);
      } else {
        // Create new marker overlay
        const markerOverlay = new CustomMarkerOverlay(
          position,
          color,
          isSelected,
          shouldPulse
        );
        markerOverlay.setZIndex(zIndex);
        markerOverlay.setMap(map);

        // Create new label overlay with a no-op click handler
        const labelOverlay = new LabelOverlay(
          position,
          color,
          session.value,
          unitSymbol,
          isSelected,
          () => {
            // No action on click for TimelapseMarkers
          },
          zIndex
        );
        labelOverlay.setMap(map);

        // Store both overlays in the markersRef
        markersRef.current.set(key, { markerOverlay, labelOverlay });
      }
    });

    // Remove markers that are no longer in the sessions array
    markersRef.current.forEach((timelapseMarker, key) => {
      if (!sessionsMap.has(key)) {
        timelapseMarker.markerOverlay.setMap(null);
        timelapseMarker.labelOverlay.setMap(null);
        markersRef.current.delete(key);
      }
    });
  }, [map, sessions, thresholds, unitSymbol]);

  // Cleanup markers when component unmounts
  useEffect(() => {
    return () => {
      markersRef.current.forEach((timelapseMarker) => {
        timelapseMarker.markerOverlay.setMap(null);
        timelapseMarker.labelOverlay.setMap(null);
      });
      markersRef.current.clear();
    };
  }, []);

  return null;
};

export { TimelapseMarkers };

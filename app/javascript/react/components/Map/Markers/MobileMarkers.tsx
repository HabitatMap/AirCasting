import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import { selectThresholds } from "../../../store/thresholdSlice";
import { LatLngLiteral } from "../../../types/googleMaps";
import { Point, Session } from "../../../types/sessionType";
import { pubSub } from "../../../utils/pubSubManager";
import { getColorForValue } from "../../../utils/thresholdColors";
import { SessionDotMarker } from "./SessionDotMarker/SessionDotMarker";
import { SessionFullMarker } from "./SessionFullMarker/SessionFullMarker";

import type { Marker } from "@googlemaps/markerclusterer";
type Props = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

const MobileMarkers = ({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
}: Props) => {
  const DISTANCE_THRESHOLD = 21;
  const ZOOM_FOR_SELECTED_SESSION = 15;

  const map = useMap();

  const thresholds = useSelector(selectThresholds);

  const [markers, setMarkers] = useState<{ [streamId: string]: Marker | null }>(
    {}
  );
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(
    null
  );

  useEffect(() => {
    const handleData = (id: number) => {
      const s = sessions.find((session) => {
        return session.id === id;
      });

      if (s?.point) {
        centerMapOnMarker(s.point);
      }
    };

    pubSub.subscribe("CENTER_MAP", handleData);

    return () => {
      pubSub.unsubscribe("CENTER_MAP", handleData);
    };
  }, [sessions]);

  useEffect(() => {
    if (selectedStreamId === null) {
      setSelectedMarkerKey(null);
    }
  }, [selectedStreamId]);

  // Update markers when marker references change
  useEffect(() => {
    const newMarkers: { [streamId: string]: Marker | null } = {};
    sessions.forEach((session) => {
      if (!markers[session.point.streamId]) {
        newMarkers[session.point.streamId] = null;
      }
    });
    setMarkers((prev) => ({
      ...prev,
      ...newMarkers,
    }));
  }, [sessions]);

  const areMarkersTooClose = (
    marker1: google.maps.LatLngLiteral,
    marker2: google.maps.LatLngLiteral
  ) => {
    if (!map) return false;

    const zoom = map.getZoom() ?? 0;
    const latDiff = marker1.lat - marker2.lat;
    const lngDiff = marker1.lng - marker2.lng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    // Convert distance to pixels based on the current zoom level
    const pixelSize = Math.pow(2, -zoom);
    const distanceInPixels = distance / pixelSize;

    return distanceInPixels < DISTANCE_THRESHOLD;
  };

  const centerMapOnMarker = (position: Point) => {
    const { lat, lng, maxLatitude, maxLongitude, minLatitude, minLongitude } =
      position;

    if (map && !selectedMarkerKey) {
      if (maxLatitude && maxLongitude && minLatitude && minLongitude) {
        const bounds: LatLngLiteral[] = [
          { lat: maxLatitude, lng: maxLongitude },
          { lat: minLatitude - (maxLatitude - minLatitude), lng: minLongitude }, // #DirtyButWorks Adjust bounds to keep marker visible and not hidden by the modal
        ];

        const googleBounds = new google.maps.LatLngBounds();

        bounds.forEach((coord) => {
          googleBounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
        });

        map.fitBounds(googleBounds);
      } else {
        map.setCenter({ lat, lng });
        map.setZoom(ZOOM_FOR_SELECTED_SESSION);
      }
    }
    setSelectedMarkerKey(null);
  };

  const renderMarkerContent = (session: Session, isSelected: boolean) => {
    const isOverlapping = sessions.some(
      (otherSession) =>
        otherSession.point.streamId !== session.point.streamId &&
        areMarkersTooClose(session.point, otherSession.point)
    );

    if (isOverlapping) {
      // Display as a dot when markers are too close
      return (
        <SessionDotMarker
          color={getColorForValue(thresholds, session.lastMeasurementValue)}
          shouldPulse={session.id === pulsatingSessionId}
          onClick={() => {
            onMarkerClick(Number(session.point.streamId), Number(session.id));
            centerMapOnMarker(session.point);
          }}
        />
      );
    }

    // Display the average value otherwise
    return (
      <SessionFullMarker
        color={getColorForValue(thresholds, session.lastMeasurementValue)}
        value={`${Math.round(session.lastMeasurementValue)} µg/m³`}
        isSelected={isSelected}
        shouldPulse={session.id === pulsatingSessionId}
        onClick={() => {
          onMarkerClick(Number(session.point.streamId), Number(session.id));
          centerMapOnMarker(session.point);
        }}
      />
    );
  };

  return (
    <>
      {sessions.map((session) => (
        <AdvancedMarker
          position={session.point}
          key={session.point.streamId}
          zIndex={1000}
          ref={(marker) => {
            if (marker && !markers[session.point.streamId]) {
              setMarkers((prev) => ({
                ...prev,
                [session.point.streamId]: marker,
              }));
            }
          }}
        >
          {renderMarkerContent(
            session,
            session.point.streamId === selectedMarkerKey
          )}
        </AdvancedMarker>
      ))}
    </>
  );
};

export { MobileMarkers };

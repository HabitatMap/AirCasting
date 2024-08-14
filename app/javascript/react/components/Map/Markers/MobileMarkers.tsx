import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import { useAppDispatch } from "../../../store/hooks";
import {
  setMarkersLoading,
  setTotalMarkers,
} from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { LatLngLiteral } from "../../../types/googleMaps";
import { Point, Session } from "../../../types/sessionType";
import { useMapParams } from "../../../utils/mapParamsHandler";
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

  // We need to adjust the latitude when the difference between max and min latitude is small and session modal is opened otherwise the session points will be hidden behind the session modal
  const LAT_DIFF_SMALL = 0.00001;
  const LAT_DIFF_MEDIUM = 0.0001;
  const LAT_ADJUST_SMALL = 0.005;

  const map = useMap();
  const dispatch = useAppDispatch();

  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useMapParams();

  const [markers, setMarkers] = useState<{ [streamId: string]: Marker | null }>(
    {}
  );
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (selectedStreamId) {
      const s = sessions.find((session) => {
        return session.point.streamId === selectedStreamId.toString();
      });

      if (s?.point) {
        centerMapOnMarker(s.point);
      }
    }
    if (selectedStreamId === null) {
      setSelectedMarkerKey(null);
    }
  }, [sessions]);

  useEffect(() => {
    if (!selectedStreamId) {
      dispatch(setMarkersLoading(true));
      dispatch(setTotalMarkers(sessions.length - 1));
    }
  }, [dispatch, sessions.length]);

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

  const calculateLatitudeDiff = (position: Point): number => {
    const { maxLatitude, minLatitude } = position;
    return maxLatitude && minLatitude ? maxLatitude - minLatitude : 0;
  };

  const adjustLatitude = (position: Point): number => {
    const { maxLatitude, minLatitude } = position;
    if (maxLatitude && minLatitude) {
      const latDiff = calculateLatitudeDiff(position);

      if (latDiff >= 0 && latDiff < LAT_DIFF_SMALL) {
        return minLatitude - LAT_ADJUST_SMALL;
      } else if (latDiff >= LAT_DIFF_SMALL && latDiff < LAT_DIFF_MEDIUM) {
        return minLatitude - latDiff * 2;
      } else {
        return minLatitude - latDiff;
      }
    }
    return position.lat;
  };

  const calculateBounds = (
    position: Point,
    adjustedLat: number
  ): LatLngLiteral[] => {
    const { maxLatitude, maxLongitude, minLongitude } = position;
    if (maxLatitude && maxLongitude && minLongitude) {
      return [
        { lat: maxLatitude, lng: maxLongitude },
        { lat: adjustedLat, lng: minLongitude },
      ];
    } else {
      return [{ lat: adjustedLat, lng: position.lng }];
    }
  };

  const centerMapOnMarker = (position: Point) => {
    const { lat, lng } = position;

    if (map && !selectedMarkerKey) {
      const latDiff = calculateLatitudeDiff(position);

      if (position.maxLongitude && position.minLongitude) {
        const adjustedLat = adjustLatitude(position);
        const bounds = calculateBounds(position, adjustedLat);
        const googleBounds = new google.maps.LatLngBounds();

        bounds.forEach((coord) =>
          googleBounds.extend(new google.maps.LatLng(coord.lat, coord.lng))
        );

        map.fitBounds(googleBounds);

        if (latDiff === 0) {
          map.setZoom(ZOOM_FOR_SELECTED_SESSION);
        }
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
        value={`${Math.round(session.lastMeasurementValue)} ${unitSymbol}`}
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
            session.point.streamId === selectedStreamId?.toString()
          )}
        </AdvancedMarker>
      ))}
    </>
  );
};

export { MobileMarkers };

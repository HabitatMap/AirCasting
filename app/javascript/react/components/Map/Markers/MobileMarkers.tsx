import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../../store/hooks";
import {
  selectMobileStreamData,
  selectMobileStreamStatus,
} from "../../../store/mobileStreamSelectors";
import { selectThresholds } from "../../../store/thresholdSlice";
import { StatusEnum } from "../../../types/api";
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
  const ZOOM_FOR_SELECTED_SESSION = 16;

  // Latitude adjustment constants
  const LAT_DIFF_SMALL = 0.00001;
  const LAT_DIFF_MEDIUM = 0.0001;
  const LAT_ADJUST_SMALL = 0.005;

  const map = useMap();
  const dispatch = useAppDispatch();
  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useMapParams();

  const mobileStreamData = useSelector(selectMobileStreamData);
  const mobileStreamStatus = useSelector(selectMobileStreamStatus);

  const [markers, setMarkers] = useState<{ [streamId: string]: Marker | null }>(
    {}
  );
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(
    null
  );
  const markersCount = Object.values(markers).filter(
    (marker) => marker !== null
  ).length;

  useEffect(() => {
    if (selectedStreamId && mobileStreamStatus !== StatusEnum.Pending) {
      const { minLatitude, maxLatitude, minLongitude, maxLongitude } =
        mobileStreamData;
      if (minLatitude && maxLatitude && minLongitude && maxLongitude) {
        centerMapOnBounds(minLatitude, maxLatitude, minLongitude, maxLongitude);
      }
    }
    if (selectedStreamId === null) {
      setSelectedMarkerKey(null);
    }
  }, [selectedStreamId, mobileStreamData, mobileStreamStatus]);

  // useEffect(() => {
  //   if (!selectedStreamId) {
  //     dispatch(setMarkersLoading(true));
  //   }
  // }, [dispatch, sessions.length]);

  // useEffect(() => {
  //   if (!selectedStreamId && markersCount >= sessions.length) {
  //     dispatch(setMarkersLoading(false));
  //   }
  // }, [dispatch, markersCount, sessions.length]);

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

  const calculateLatitudeDiff = (
    minLatitude: number,
    maxLatitude: number
  ): number => {
    return maxLatitude - minLatitude;
  };

  const adjustLatitude = (minLatitude: number, maxLatitude: number): number => {
    const latDiff = calculateLatitudeDiff(minLatitude, maxLatitude);

    if (latDiff >= 0 && latDiff < LAT_DIFF_SMALL) {
      return minLatitude - LAT_ADJUST_SMALL;
    } else if (latDiff >= LAT_DIFF_SMALL && latDiff < LAT_DIFF_MEDIUM) {
      return minLatitude - latDiff * 2;
    } else {
      return minLatitude - latDiff;
    }
  };

  const calculateBounds = (
    maxLatitude: number,
    minLongitude: number,
    maxLongitude: number,
    adjustedLat: number
  ): LatLngLiteral[] => {
    return [
      { lat: maxLatitude, lng: maxLongitude },
      { lat: adjustedLat, lng: minLongitude },
    ];
  };

  const centerMapOnBounds = (
    minLatitude: number,
    maxLatitude: number,
    minLongitude: number,
    maxLongitude: number
  ) => {
    if (map && !selectedMarkerKey) {
      const latDiff = calculateLatitudeDiff(minLatitude, maxLatitude);
      const lngDiff = maxLongitude - minLongitude;

      if (latDiff < LAT_DIFF_SMALL && lngDiff < LAT_DIFF_SMALL) {
        const centerLat = (maxLatitude + minLatitude) / 2;
        const centerLng = (maxLongitude + minLongitude) / 2;
        map.setCenter({ lat: centerLat, lng: centerLng });
        map.setZoom(ZOOM_FOR_SELECTED_SESSION);
      } else {
        const adjustedLat = adjustLatitude(minLatitude, maxLatitude);
        const bounds = calculateBounds(
          maxLatitude,
          minLongitude,
          maxLongitude,
          adjustedLat
        );
        const googleBounds = new google.maps.LatLngBounds();

        bounds.forEach((coord) =>
          googleBounds.extend(new google.maps.LatLng(coord.lat, coord.lng))
        );
        map.fitBounds(googleBounds);

        if (latDiff === 0) {
          map.setZoom(ZOOM_FOR_SELECTED_SESSION);
        }
      }

      setSelectedMarkerKey(null);
    }
  };

  const centerMapOnMarker = (position: Point) => {
    const { lat, lng } = position;

    if (map && !selectedMarkerKey) {
      map.setCenter({ lat, lng });
      map.setZoom(ZOOM_FOR_SELECTED_SESSION);
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

import { useMap } from "@vis.gl/react-google-maps";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../../store/hooks";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
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
import { CustomMarker } from "./CustomMarker";
import { SessionDotMarker } from "./SessionDotMarker/SessionDotMarker";
import { SessionFullMarker } from "./SessionFullMarker/SessionFullMarker";

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

  const markerRefs = useRef<Map<string, CustomMarker>>(new Map());
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(
    null
  );

  // Memoized function to check if markers are too close
  const areMarkersTooClose = useCallback(
    (
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
    },
    [map]
  );

  // Helper functions
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

  // Memoized function to center the map on bounds
  const centerMapOnBounds = useCallback(
    (
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
    },
    [map, selectedMarkerKey]
  );

  // Memoized function to center the map on a specific marker
  const centerMapOnMarker = useCallback(
    (position: Point) => {
      const { lat, lng } = position;

      if (map && !selectedMarkerKey) {
        map.setCenter({ lat, lng });
        map.setZoom(ZOOM_FOR_SELECTED_SESSION);
      }
      setSelectedMarkerKey(null);
    },
    [map, selectedMarkerKey]
  );

  // Memoized function to render marker content
  const renderMarkerContent = useCallback(
    (session: Session, isSelected: boolean) => {
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
    },
    [
      sessions,
      thresholds,
      unitSymbol,
      pulsatingSessionId,
      onMarkerClick,
      centerMapOnMarker,
      areMarkersTooClose,
    ]
  );

  // Memoized function to create markers
  const createMarker = useCallback(
    (session: Session): CustomMarker => {
      const position = session.point;
      const isSelected =
        session.point.streamId === selectedStreamId?.toString();

      const content = renderMarkerContent(session, isSelected);

      const color = getColorForValue(thresholds, session.lastMeasurementValue);

      const marker = new CustomMarker(
        position,
        color,
        "",
        12,
        content,
        () => {
          onMarkerClick(Number(session.point.streamId), Number(session.id));
          centerMapOnMarker(session.point);
        },
        20
      );

      marker.setPulsating(session.id === pulsatingSessionId);
      marker.setMap(map);

      return marker;
    },
    [
      map,
      onMarkerClick,
      centerMapOnMarker,
      pulsatingSessionId,
      thresholds,
      renderMarkerContent,
      selectedStreamId,
    ]
  );

  // Center map when selectedStreamId changes
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
  }, [
    selectedStreamId,
    mobileStreamData,
    mobileStreamStatus,
    centerMapOnBounds,
  ]);

  // Set markers loading state
  useEffect(() => {
    if (!selectedStreamId) {
      dispatch(setMarkersLoading(true));
    }
  }, [dispatch, sessions.length, selectedStreamId]);

  // Manage markers on the map
  useEffect(() => {
    if (!map) return;

    sessions.forEach((session) => {
      const markerId = session.point.streamId;
      let marker = markerRefs.current.get(markerId);
      if (!marker) {
        marker = createMarker(session);
        markerRefs.current.set(markerId, marker);
      } else {
        const isPulsating = session.id === pulsatingSessionId;
        const isSelected =
          session.point.streamId === selectedStreamId?.toString();
        const newContent = renderMarkerContent(session, isSelected);

        // Convert session.point to google.maps.LatLng
        const sessionLatLng = new google.maps.LatLng(
          session.point.lat,
          session.point.lng
        );

        // Get marker position
        const markerPosition = marker.getPosition();

        // Update only if necessary
        if (markerPosition && !markerPosition.equals(sessionLatLng)) {
          marker.setPosition(session.point);
        }

        if (marker.isPulsating() !== isPulsating) {
          marker.setPulsating(isPulsating);
        }

        if (marker.getContent() !== newContent) {
          marker.setContent(newContent);
        }
      }
    });

    const sessionStreamIds = new Set(sessions.map((s) => s.point.streamId));
    markerRefs.current.forEach((marker, markerId) => {
      if (!sessionStreamIds.has(markerId)) {
        marker.setMap(null);
        markerRefs.current.delete(markerId);
      }
    });

    // After markers are loaded, dispatch setMarkersLoading(false)
    if (!selectedStreamId && markerRefs.current.size >= sessions.length) {
      dispatch(setMarkersLoading(false));
    }
  }, [
    sessions,
    map,
    createMarker,
    renderMarkerContent,
    pulsatingSessionId,
    selectedStreamId,
    dispatch,
  ]);

  // Cleanup markers when component unmounts
  useEffect(() => {
    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current.clear();
    };
  }, []);

  return null; // Markers are managed via CustomMarker instances
};

export { MobileMarkers };

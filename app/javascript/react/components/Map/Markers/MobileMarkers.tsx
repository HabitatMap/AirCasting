"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { LabelOverlay } from "./customMarkerLabel";
import { CustomMarkerOverlay } from "./customMarkerOverlay";

type Props = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

export function MobileMarkers({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
}: Props) {
  const DISTANCE_THRESHOLD = 21;
  const ZOOM_FOR_SELECTED_SESSION = 16;
  const LAT_DIFF_SMALL = 0.00001;
  const LAT_DIFF_MEDIUM = 0.0001;
  const LAT_ADJUST_SMALL = 0.005;
  const BASE_Z_INDEX = 1;
  const SELECTED_Z_INDEX = 2;

  const map = useMap();
  const dispatch = useAppDispatch();
  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useMapParams();
  const mobileStreamData = useSelector(selectMobileStreamData);
  const mobileStreamStatus = useSelector(selectMobileStreamStatus);

  const markerRefs = useRef<Map<string, CustomMarker>>(new Map());
  const markerOverlays = useRef<Map<string, CustomMarkerOverlay>>(new Map());
  const labelOverlays = useRef<Map<string, LabelOverlay>>(new Map());
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(
    null
  );

  const areMarkersTooClose = useCallback(
    (marker1: LatLngLiteral, marker2: LatLngLiteral) => {
      if (!map) return false;
      const zoom = map.getZoom() ?? 0;
      const latDiff = marker1.lat - marker2.lat;
      const lngDiff = marker1.lng - marker2.lng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      const pixelSize = Math.pow(2, -zoom);
      const distanceInPixels = distance / pixelSize;
      return distanceInPixels < DISTANCE_THRESHOLD;
    },
    [map]
  );

  const centerMapOnBounds = useCallback(
    (
      minLatitude: number,
      maxLatitude: number,
      minLongitude: number,
      maxLongitude: number
    ) => {
      if (map && !selectedMarkerKey) {
        const latDiff = maxLatitude - minLatitude;
        const lngDiff = maxLongitude - minLongitude;

        if (latDiff < LAT_DIFF_SMALL && lngDiff < LAT_DIFF_SMALL) {
          const centerLat = (maxLatitude + minLatitude) / 2;
          const centerLng = (maxLongitude + minLongitude) / 2;
          map.setCenter({ lat: centerLat, lng: centerLng });
          map.setZoom(ZOOM_FOR_SELECTED_SESSION);
        } else {
          let adjustedLat: number;
          if (latDiff >= 0 && latDiff < LAT_DIFF_SMALL) {
            adjustedLat = minLatitude - LAT_ADJUST_SMALL;
          } else if (latDiff >= LAT_DIFF_SMALL && latDiff < LAT_DIFF_MEDIUM) {
            adjustedLat = minLatitude - latDiff * 2;
          } else {
            adjustedLat = minLatitude - latDiff;
          }
          const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(adjustedLat, minLongitude),
            new google.maps.LatLng(maxLatitude, maxLongitude)
          );
          map.fitBounds(bounds);
          if (latDiff === 0) {
            map.setZoom(ZOOM_FOR_SELECTED_SESSION);
          }
        }
        setSelectedMarkerKey(null);
      }
    },
    [map, selectedMarkerKey]
  );

  const centerMapOnMarker = useCallback(
    (position: Point) => {
      if (map && !selectedMarkerKey) {
        map.setCenter(position);
        map.setZoom(ZOOM_FOR_SELECTED_SESSION);
      }
      setSelectedMarkerKey(null);
    },
    [map, selectedMarkerKey]
  );

  const createMarker = useCallback(
    (session: Session): CustomMarker => {
      const color = getColorForValue(thresholds, session.lastMeasurementValue);
      const shouldPulse = session.id === pulsatingSessionId;
      const size = 12;
      const isSelected =
        session.point.streamId === selectedStreamId?.toString();

      const marker = new CustomMarker(
        session.point,
        color,
        "",
        size,
        undefined,
        () => {
          onMarkerClick(Number(session.point.streamId), Number(session.id));
          centerMapOnMarker(session.point);
        },
        size
      );

      marker.setPulsating(shouldPulse);
      marker.setZIndex(BASE_Z_INDEX);

      return marker;
    },
    [
      sessions,
      thresholds,
      pulsatingSessionId,
      selectedStreamId,
      areMarkersTooClose,
      onMarkerClick,
      centerMapOnMarker,
    ]
  );

  const updateMarkers = useCallback(() => {
    markerRefs.current.forEach((marker, streamId) => {
      const session = sessions.find((s) => s.point.streamId === streamId);
      if (!session) return;

      const isSelected = streamId === selectedStreamId?.toString();
      const shouldPulse = session.id === pulsatingSessionId;
      const isOverlapping = sessions.some(
        (otherSession) =>
          otherSession.point.streamId !== streamId &&
          areMarkersTooClose(session.point, otherSession.point)
      );
      const color = getColorForValue(thresholds, session.lastMeasurementValue);
      const size = 12;

      marker.setColor(color);
      marker.setSize(size);
      marker.setPulsating(shouldPulse);
      marker.setClickableAreaSize(size);
      marker.setZIndex(isSelected ? SELECTED_Z_INDEX : BASE_Z_INDEX);

      if (isOverlapping) {
        const existingOverlay = markerOverlays.current.get(streamId);
        if (existingOverlay) {
          existingOverlay.setMap(null);
          markerOverlays.current.delete(streamId);
        }
        const existingLabel = labelOverlays.current.get(streamId);
        if (existingLabel) {
          existingLabel.setMap(null);
          labelOverlays.current.delete(streamId);
        }
      } else {
        let overlay = markerOverlays.current.get(streamId);
        if (!overlay) {
          overlay = new CustomMarkerOverlay(
            marker.getPosition()!,
            color,
            isSelected,
            shouldPulse
          );
          overlay.setMap(map);
          markerOverlays.current.set(streamId, overlay);
        } else {
          overlay.setIsSelected(isSelected);
          overlay.setShouldPulse(shouldPulse);
          overlay.setColor(color);
          overlay.update();
        }
        overlay.setZIndex(isSelected ? SELECTED_Z_INDEX : BASE_Z_INDEX);

        let labelOverlay = labelOverlays.current.get(streamId);
        if (!labelOverlay) {
          labelOverlay = new LabelOverlay(
            marker.getPosition()!,
            color,
            session.lastMeasurementValue,
            unitSymbol,
            isSelected,
            () => {
              onMarkerClick(Number(streamId), Number(session.id));
              centerMapOnMarker(session.point);
            }
          );
          labelOverlay.setMap(map);
          labelOverlays.current.set(streamId, labelOverlay);
        } else {
          labelOverlay.update(
            isSelected,
            color,
            session.lastMeasurementValue,
            unitSymbol
          );
        }
        labelOverlay.setZIndex(isSelected ? SELECTED_Z_INDEX : BASE_Z_INDEX);
      }
    });
  }, [
    sessions,
    selectedStreamId,
    pulsatingSessionId,
    thresholds,
    unitSymbol,
    areMarkersTooClose,
    map,
    onMarkerClick,
    centerMapOnMarker,
  ]);

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

  useEffect(() => {
    if (!selectedStreamId) {
      dispatch(setMarkersLoading(true));
    }
  }, [dispatch, sessions.length, selectedStreamId]);

  useEffect(() => {
    if (!map) return;

    const updatedMarkers = new Set<string>();

    sessions.forEach((session) => {
      const markerId = session.point.streamId;
      updatedMarkers.add(markerId);

      let marker = markerRefs.current.get(markerId);
      if (!marker) {
        marker = createMarker(session);
        marker.setMap(map);
        markerRefs.current.set(markerId, marker);
      } else {
        marker.setPosition(session.point);
      }
    });

    markerRefs.current.forEach((marker, markerId) => {
      if (!updatedMarkers.has(markerId)) {
        marker.setMap(null);
        markerRefs.current.delete(markerId);
        const overlay = markerOverlays.current.get(markerId);
        if (overlay) {
          overlay.setMap(null);
          markerOverlays.current.delete(markerId);
        }
        const labelOverlay = labelOverlays.current.get(markerId);
        if (labelOverlay) {
          labelOverlay.setMap(null);
          labelOverlays.current.delete(markerId);
        }
      }
    });

    updateMarkers();

    if (!selectedStreamId && markerRefs.current.size >= sessions.length) {
      dispatch(setMarkersLoading(false));
    }
  }, [sessions, map, createMarker, updateMarkers, selectedStreamId, dispatch]);

  useEffect(() => {
    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current.clear();
      markerOverlays.current.forEach((overlay) => overlay.setMap(null));
      markerOverlays.current.clear();
      labelOverlays.current.forEach((overlay) => overlay.setMap(null));
      labelOverlays.current.clear();
    };
  }, []);

  return null;
}

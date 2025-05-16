import { type MapEvent } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../store/hooks";
import { UserSettings } from "../../../../types/userStates";
import * as Cookies from "../../../../utils/cookies";
import { UrlParamsTypes } from "../../../../utils/mapParamsHandler";
import mapStyles from "../mapUtils/mapStyles";
import mapStylesZoomedIn from "../mapUtils/mapStylesZoomedIn";

interface UseMapInitializationProps {
  currentCenter: google.maps.LatLngLiteral;
  currentZoom: number;
  currentUserSettings: UserSettings;
  previousUserSettings: UserSettings;
  sessionType: string;
  isFirstRender: React.MutableRefObject<boolean>;
  searchParams: URLSearchParams;
  navigate: ReturnType<typeof useNavigate>;
}

export const useMapInitialization = ({
  currentCenter: initialCenter,
  currentZoom: initialZoom,
  currentUserSettings,
  sessionType,
  isFirstRender,
  searchParams,
  navigate,
}: UseMapInitializationProps) => {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const memoizedMapStyles = useRef(mapStyles);
  const isZoomingRef = useRef(false);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get realtimeMapUpdates from store
  const realtimeMapUpdates = useAppSelector(
    (state) => state.realtimeMapUpdates.realtimeMapUpdates
  );

  // Clean up the timeout when component unmounts
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  const applyMapStylesBasedOnZoom = useCallback(
    (
      map: google.maps.Map | null,
      mapStylesZoomedIn: any,
      defaultMapStyles: any
    ) => {
      if (!map) return;

      const zoom = map.getZoom();

      if (zoom && zoom >= 5.5) {
        map.setOptions({
          styles: mapStylesZoomedIn,
        });
      } else {
        map.setOptions({
          styles: defaultMapStyles,
        });
      }
    },
    []
  );

  const updateMapUrlParameters = useCallback(
    (map: google.maps.Map, updateBounds: boolean) => {
      const bounds = map?.getBounds();
      if (!bounds) {
        return;
      }

      // Always update current center and zoom for proper map state
      const mapCenter = JSON.stringify(
        map.getCenter()?.toJSON() || initialCenter
      );
      const mapZoom = (map.getZoom() || initialZoom).toString();

      // Save to cookies and update URL
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set(UrlParamsTypes.currentCenter, mapCenter);
      newSearchParams.set(UrlParamsTypes.currentZoom, mapZoom);

      Cookies.set(UrlParamsTypes.currentCenter, mapCenter);
      Cookies.set(UrlParamsTypes.currentZoom, mapZoom);

      // Only update bounds and trigger a data refresh if updateBounds is true
      if (updateBounds) {
        const north = bounds.getNorthEast().lat();
        const south = bounds.getSouthWest().lat();
        const east = bounds.getNorthEast().lng();
        const west = bounds.getSouthWest().lng();

        newSearchParams.set(UrlParamsTypes.boundEast, east.toString());
        newSearchParams.set(UrlParamsTypes.boundNorth, north.toString());
        newSearchParams.set(UrlParamsTypes.boundSouth, south.toString());
        newSearchParams.set(UrlParamsTypes.boundWest, west.toString());

        // Save bounds to cookies
        Cookies.set(UrlParamsTypes.boundEast, east.toString());
        Cookies.set(UrlParamsTypes.boundNorth, north.toString());
        Cookies.set(UrlParamsTypes.boundSouth, south.toString());
        Cookies.set(UrlParamsTypes.boundWest, west.toString());
      }

      navigate(`?${newSearchParams.toString()}`);
    },
    [searchParams, navigate, initialCenter, initialZoom]
  );

  const handleMapIdle = useCallback(
    (event: MapEvent) => {
      const map = event.map;
      if (!mapInstance) {
        setMapInstance(map);
        map.setOptions({
          clickableIcons: false,
        });
      }

      applyMapStylesBasedOnZoom(
        map,
        mapStylesZoomedIn,
        memoizedMapStyles.current
      );

      if (isFirstRender.current) {
        if (currentUserSettings === UserSettings.MapView) {
          const newSearchParams = new URLSearchParams(searchParams.toString());
          newSearchParams.set(UrlParamsTypes.sessionType, sessionType);
          newSearchParams.set(UrlParamsTypes.isActive, "true");
          map.setCenter(initialCenter);
          map.setZoom(initialZoom);
        }
        isFirstRender.current = false;
      } else if (
        [UserSettings.MapView, UserSettings.CrowdMapView].includes(
          currentUserSettings
        )
      ) {
        // Only update bounds (which triggers data refresh) if realtimeMapUpdates is true
        updateMapUrlParameters(map, realtimeMapUpdates);
      }
    },
    [
      currentUserSettings,
      mapInstance,
      searchParams,
      initialCenter,
      initialZoom,
      sessionType,
      isFirstRender,
      realtimeMapUpdates,
      applyMapStylesBasedOnZoom,
      updateMapUrlParameters,
    ]
  );

  const handleZoomChanged = useCallback(() => {
    if (mapInstance) {
      // Always apply styles based on zoom level
      applyMapStylesBasedOnZoom(
        mapInstance,
        mapStylesZoomedIn,
        memoizedMapStyles.current
      );

      // Set zooming flag to true
      isZoomingRef.current = true;

      // Clear any existing timeout
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }

      // Set a new timeout to update the URL parameters when zooming ends
      zoomTimeoutRef.current = setTimeout(() => {
        if (mapInstance) {
          // When zoom ends, update URL, but only update bounds if realtimeMapUpdates is true
          updateMapUrlParameters(mapInstance, realtimeMapUpdates);
        }
        isZoomingRef.current = false;
      }, 500); // Wait for 500ms after the last zoom event
    }
  }, [
    mapInstance,
    applyMapStylesBasedOnZoom,
    realtimeMapUpdates,
    updateMapUrlParameters,
  ]);

  return {
    mapInstance,
    handleMapIdle,
    handleZoomChanged,
  };
};

import { Session } from "../types/sessionType";
import { MapBounds } from "../types/map";

const calculateSessionBounds = (sessions: Session[]): MapBounds => {
  let minLat = Number.MAX_VALUE,
    maxLat = -Number.MAX_VALUE;
  let minLng = Number.MAX_VALUE,
    maxLng = -Number.MAX_VALUE;

  sessions.forEach((session) => {
    const { maxLatitude, maxLongitude, minLatitude, minLongitude } =
      session.point;
    if (!maxLatitude || !maxLongitude || !minLatitude || !minLongitude) {
      return;
    }
    if (minLatitude < minLat) minLat = minLatitude;
    if (maxLatitude > maxLat) maxLat = maxLatitude;
    if (minLongitude < minLng) minLng = minLongitude;
    if (maxLongitude > maxLng) maxLng = maxLongitude;
  });

  return { minLat, maxLat, minLng, maxLng };
};

const calculateVisibleMapBounds = (
  bounds: MapBounds,
  modalHeight: number
): MapBounds => {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const mapHeight = window.innerHeight;
  const visibleMapHeight = mapHeight - modalHeight;

  const latDiff = maxLat - minLat;
  const latPerPixel = latDiff / mapHeight;
  const latOffset = (mapHeight - visibleMapHeight) * latPerPixel;

  return {
    minLat: minLat - latOffset / 2,
    maxLat: maxLat + latOffset / 2,
    minLng,
    maxLng,
  };
};

const adjustMapCenter = (bounds: MapBounds, map: google.maps.Map) => {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  map.setCenter({ lat: centerLat, lng: centerLng });

  const GLOBE_WIDTH = 256; // I stole it from Google. Now you know the globe's width. Booyah.
  const mapDim = {
    height: window.innerHeight,
    width: window.innerWidth,
  };

  function getZoom(mapPx: number, worldPx: number, fraction: number): number {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }

  const latFraction = (maxLat - minLat) / 360;
  const lngFraction = (maxLng - minLng) / 360;
  const latZoom = getZoom(mapDim.height, GLOBE_WIDTH, latFraction);
  const lngZoom = getZoom(mapDim.width, GLOBE_WIDTH, lngFraction);

  const zoom = Math.min(latZoom, lngZoom);

  map.setZoom(zoom);
};

export { calculateSessionBounds, calculateVisibleMapBounds, adjustMapCenter };

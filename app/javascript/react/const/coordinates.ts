type MapBounds = {
  north: number;
  south: number;
  west: number;
  east: number;
};

type DeviceType =
  | "mobile-small"
  | "mobile-medium"
  | "desktop-small"
  | "desktop";

const DEFAULT_MAP_CENTER = {
  lat: 37.08877211846209,
  lng: -95.72238290534534,
};

const DEVICE_CONFIGS: Record<
  DeviceType,
  { maxWidth: number; bounds: MapBounds }
> = {
  "mobile-small": {
    maxWidth: 450,
    bounds: {
      north: 49.3457868,
      south: 24.396308,
      west: -105.17062513488536,
      east: -86.27414067580531,
    },
  },
  "mobile-medium": {
    maxWidth: 750,
    bounds: {
      north: 49.3457868,
      south: 24.396308,
      west: -112.15792978034534,
      east: -79.28683603034534,
    },
  },
  "desktop-small": {
    maxWidth: 900,
    bounds: {
      north: 49.3457868,
      south: 24.396308,
      west: -115.49777365529263,
      east: -75.94699215539805,
    },
  },
  desktop: {
    maxWidth: Infinity,
    bounds: {
      north: 49.3457868,
      south: 24.396308,
      west: -125.00001,
      east: -66.93457,
    },
  },
};

const getDeviceType = (): DeviceType => {
  const width = window.innerWidth;
  return (
    (Object.keys(DEVICE_CONFIGS) as DeviceType[]).find(
      (deviceType) => width <= DEVICE_CONFIGS[deviceType].maxWidth
    ) || "desktop"
  );
};

const getDefaultMapBounds = (): MapBounds =>
  DEVICE_CONFIGS[getDeviceType()].bounds;

const DEFAULT_MAP_BOUNDS = getDefaultMapBounds();
const DEFAULT_ZOOM = 5;
const MIN_ZOOM = 3;

export { DEFAULT_MAP_BOUNDS, DEFAULT_MAP_CENTER, DEFAULT_ZOOM, MIN_ZOOM };

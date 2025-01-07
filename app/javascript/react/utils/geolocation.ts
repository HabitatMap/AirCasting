import { UrlParamsTypes } from "./mapParamsHandler";

const DEFAULT_ZOOM = 12;

interface GeolocationResponse {
  location: {
    lat: number;
    lng: number;
  };
}

export const getBrowserLocation = async (
  map: google.maps.Map | null,
  setUrlParams: (params: { key: UrlParamsTypes; value: string }[]) => void
): Promise<{ lat: number; lng: number } | null> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.GOOGLE_MAPS_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          considerIp: true,
        }),
      }
    );

    const data: GeolocationResponse = await response.json();

    if (data.location) {
      const { lat, lng } = data.location;

      setUrlParams([
        {
          key: UrlParamsTypes.currentCenter,
          value: JSON.stringify({ lat, lng }),
        },
        {
          key: UrlParamsTypes.currentZoom,
          value: DEFAULT_ZOOM.toString(),
        },
      ]);

      map?.setZoom(DEFAULT_ZOOM);
      map?.panTo({ lat, lng });

      return { lat, lng };
    }
    return null;
  } catch (error) {
    return null;
  }
};

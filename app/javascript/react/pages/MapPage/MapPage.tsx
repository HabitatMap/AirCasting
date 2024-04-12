import React from "react";
import { useLoadScript } from "@react-google-maps/api";

import { Map } from "../../components/Map";

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "";

const MapPage = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey,
    libraries: ["places"],
  });

  return isLoaded ? <Map /> : <div>Loading Maps...</div>;
};

export { MapPage };

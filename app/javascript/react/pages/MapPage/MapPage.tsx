import React from "react";

import { APIProvider } from "@vis.gl/react-google-maps";

import { Map } from "../../components/Map";

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "";

interface MapPageProps {
  children: React.ReactNode;
}

const MapPage: React.FC<MapPageProps> = ({ children }) => {
  return (
    <APIProvider
      apiKey={googleMapsApiKey}
      onLoad={() => console.log("Maps API has loaded.")}
    >
      {children}
      <Map />
    </APIProvider>
  );
};

export { MapPage };
import React from "react";

import { APIProvider } from "@vis.gl/react-google-maps";

import { Map } from "../../components/Map";
import { FocusTabController } from "../../utils/focusTabController";
import useMobileDetection from "../../utils/useScreenSizeDetection";

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "";

interface MapPageProps {
  children: React.ReactNode;
}

const MapPage: React.FC<MapPageProps> = ({ children }) => {
  const isMobile = useMobileDetection();

  return (
    <APIProvider
      apiKey={googleMapsApiKey}
      onLoad={() => console.log("Maps API has loaded.")}
    >
      {children}
      {/* {!isMobile && <MapButtons />} */}
      <FocusTabController />
      <Map />
    </APIProvider>
  );
};

export { MapPage };

import React, { useState } from "react";

import { APIProvider } from "@vis.gl/react-google-maps";

import { MapButtons } from "../../components/molecules/MapButtons/MapButtons";
import { Map } from "../../components/organisms/Map/Map";
import { CookieBanner } from "../../components/organisms/Modals/CookieBanner/CookieBanner";
import { CookieSettingsModal } from "../../components/organisms/Modals/CookieSettingsModal/CookieSettingsModal";
import { FocusTabController } from "../../utils/focusTabController";
import useMobileDetection from "../../utils/useScreenSizeDetection";

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "";

interface MapPageProps {
  children: React.ReactNode;
}

const MapPage: React.FC<MapPageProps> = ({ children }) => {
  const isMobile = useMobileDetection();
  const [cookieSettingsModalOpen, setCookieSettingsModalOpen] =
    useState<boolean>(false);

  const handleOpenCookieSettings = () => {
    setCookieSettingsModalOpen(true);
  };

  const handleCloseCookieSettings = () => {
    setCookieSettingsModalOpen(false);
  };

  return (
    <APIProvider
      apiKey={googleMapsApiKey}
      onLoad={() => console.log("Maps API has loaded.")}
    >
      {children}
      {!isMobile && <MapButtons />}
      <FocusTabController />
      <Map />
      <CookieBanner onOpenCookieSettings={handleOpenCookieSettings} />
      <CookieSettingsModal
        isOpen={cookieSettingsModalOpen}
        onClose={handleCloseCookieSettings}
      />
    </APIProvider>
  );
};

export { MapPage };

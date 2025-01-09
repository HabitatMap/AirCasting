import React, { useEffect, useState } from "react";

import { APIProvider } from "@vis.gl/react-google-maps";

import { Loader } from "../../components/Loader/Loader";
import { Map } from "../../components/Map";
import { MapButtons } from "../../components/MapButtons/MapButtons";
import { FocusTabController } from "../../utils/focusTabController";
import useMobileDetection from "../../utils/useScreenSizeDetection";

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "";

interface MapPageProps {
  children: React.ReactNode;
}

const MapPage: React.FC<MapPageProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const isMobile = useMobileDetection();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  if (!googleMapsApiKey) {
    console.error("Google Maps API key is missing");
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <h2>Configuration Error: Missing Maps API Key</h2>
      </div>
    );
  }

  const handleMapLoad = () => {
    console.log("Maps API has loaded.");
    setIsLoading(false);
  };

  const handleMapError = (error: Error) => {
    console.error("Error loading Maps API:", error);
    setHasError(true);
    setIsLoading(false);
  };

  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount((prev) => prev + 1);
      setIsLoading(true);
      setHasError(false);
      // Force reload the Maps API
      window.location.reload();
    } else {
      console.error("Max retries reached for loading Google Maps");
    }
  };

  useEffect(() => {
    // Add a timeout to detect slow loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Maps API loading taking too long");
        handleRetry();
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeoutId);
  }, [isLoading, retryCount]);

  if (hasError) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h2>Failed to load Google Maps</h2>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 9999,
          }}
        >
          <Loader />
        </div>
      )}
      <APIProvider apiKey={googleMapsApiKey} onLoad={handleMapLoad}>
        {children}
        {!isMobile && <MapButtons />}
        <FocusTabController />
        <Map />
      </APIProvider>
    </>
  );
};

export { MapPage };

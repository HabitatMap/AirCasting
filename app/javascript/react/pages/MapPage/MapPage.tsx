import React, { useState, useEffect } from "react";

import { APIProvider } from "@vis.gl/react-google-maps";

import { Map } from "../../components/Map";
import { StyledMapContainer } from "./MapPage.style";
import { EventType } from "../../types/eventType";

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "";

interface MapPageProps {
  children: React.ReactNode;
}

const MapPage: React.FC<MapPageProps> = ({ children }) => {
  const [isTabbing, setIsTabbing] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        setIsTabbing(true);
      }
    };

    const handleMouseDown = () => {
      setIsTabbing(false);
    };

    window.addEventListener(EventType.keyDown, handleKeyDown);
    window.addEventListener(EventType.mouseDown, handleMouseDown);

    return () => {
      window.removeEventListener(EventType.keyDown, handleKeyDown);
      window.removeEventListener(EventType.mouseDown, handleMouseDown);
    };
  }, []);

  return (
    <APIProvider
      apiKey={googleMapsApiKey}
      onLoad={() => console.log("Maps API has loaded.")}
    >
      {children}
      <StyledMapContainer isTabbing={isTabbing}>
        <Map />
      </StyledMapContainer>
    </APIProvider>
  );
};

export { MapPage };

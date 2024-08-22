import { useEffect } from "react";

const useMapEventListeners = (
  map: google.maps.Map | null,
  eventHandlers: { [eventName: string]: () => void }
) => {
  useEffect(() => {
    if (map) {
      Object.entries(eventHandlers).forEach(([eventName, handler]) => {
        map.addListener(eventName, handler);
      });

      // Cleanup function to remove listeners on unmount
      return () => {
        if (map) {
          Object.keys(eventHandlers).forEach((eventName) => {
            google.maps.event.clearListeners(map, eventName);
          });
        }
      };
    }
  }, [map, eventHandlers]);
};

export default useMapEventListeners;

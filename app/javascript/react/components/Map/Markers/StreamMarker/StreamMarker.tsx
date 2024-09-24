// StreamMarker.tsx
import React, { useEffect } from "react";
import { useAppDispatch } from "../../../../store/hooks";
import { incrementLoadedMarkers } from "../../../../store/markersLoadingSlice";
import { StreamMarkerCircle } from "./StreamMarker.style";

interface StreamMarkerProps {
  color: string;
}

const StreamMarker = ({ color }: StreamMarkerProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Dispatch increment immediately upon mounting
    dispatch(incrementLoadedMarkers());
  }, [dispatch]);

  return <StreamMarkerCircle color={color} />;
};

export { StreamMarker };

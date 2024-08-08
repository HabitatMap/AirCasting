import React, { useEffect } from "react";

import {
  DataContainer,
  MarkerCircle,
  MarkerContainer,
} from "./SessionDotMarker.style";
import { useAppDispatch } from "../../../../store/hooks";
import { incrementLoadedMarkers } from "../../../../store/markersLoadingSlice";

interface MarkerProps {
  color: string;
  shouldPulse?: boolean;
  onClick: () => void;
  opacity?: number;
}

const SessionDotMarker = ({
  color,
  shouldPulse = false,
  onClick,
  opacity = 1,
}: MarkerProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(incrementLoadedMarkers());
  }, [dispatch]);

  return (
    <MarkerContainer onClick={onClick}>
      <DataContainer>
        <MarkerCircle
          color={color}
          $shouldPulse={shouldPulse}
          $opacity={opacity}
        />
      </DataContainer>
    </MarkerContainer>
  );
};

export { SessionDotMarker };

import React from "react";

import { useAppDispatch } from "../../../../store/hooks";
import { StreamMarkerCircle } from "./StreamMarker.style";

interface StreamMarkerProps {
  color: string;
}

const StreamMarker = ({ color }: StreamMarkerProps) => {
  const dispatch = useAppDispatch();

  // useEffect(() => {
  //   setTimeout(() => {
  //     dispatch(incrementLoadedMarkers());
  //   }, 400);
  // }, [dispatch]);

  return <StreamMarkerCircle color={color} />;
};

export { StreamMarker };

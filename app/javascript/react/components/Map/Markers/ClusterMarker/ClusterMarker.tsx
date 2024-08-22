import React from "react";
import { ClusterIcon } from "./ClusterIcon";

interface MarkerProps {
  color: string;
}

const ClusterlMarker = ({ color }: MarkerProps) => {
  return <ClusterIcon color={color} />;
};

export { ClusterlMarker };

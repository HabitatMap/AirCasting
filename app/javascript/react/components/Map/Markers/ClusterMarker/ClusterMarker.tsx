import React from "react";
import { ClusterIcon } from "./ClusterIcon";

interface MarkerProps {
  color: string;
}

const ClusterMarker = ({ color }: MarkerProps) => {
  return <ClusterIcon color={color} />;
};

export { ClusterMarker };

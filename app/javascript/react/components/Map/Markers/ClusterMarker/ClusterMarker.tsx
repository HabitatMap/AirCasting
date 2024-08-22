import React from "react";

import Cluster from "../../../../assets/icons/markers/marker-cluster-green.svg";

interface MarkerProps {
  color: string;
  value: string;
}

const ClusterlMarker = ({ color, value }: MarkerProps) => {
  return (
    <div>
      <img src={Cluster} color={color} />
    </div>
  );
};

export { ClusterlMarker };

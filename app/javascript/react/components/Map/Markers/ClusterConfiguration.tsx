// createFixedMarkersRenderer.ts

import { Cluster } from "@googlemaps/markerclusterer";
import { green, orange, red, yellow } from "../../../assets/styles/colors";
import { CustomMarker } from "../../../types/googleMaps";
import { createClusterIcon } from "./createMarkerIcon";

interface Thresholds {
  low: number;
  middle: number;
  high: number;
}

interface RendererParams {
  thresholds: Thresholds;
  updateClusterStyle: (
    clusterMarker: google.maps.Marker,
    markers: google.maps.Marker[],
    thresholds: Thresholds
  ) => void;
  clusterElementsRef: React.MutableRefObject<Map<Cluster, google.maps.Marker>>;
}

export const createFixedMarkersRenderer = ({
  thresholds,
  updateClusterStyle,
  clusterElementsRef,
}: RendererParams) => ({
  render: (cluster: Cluster) => {
    // Accept the entire Cluster object
    const { count, position, markers = [] } = cluster;

    const customMarkers = markers as CustomMarker[];

    const sum = customMarkers.reduce(
      (acc, marker) => acc + Number(marker.get("value") || 0),
      0
    );
    const average = sum / customMarkers.length;

    let styleIndex = 0;
    if (average < thresholds.low) styleIndex = 0;
    else if (average <= thresholds.middle) styleIndex = 1;
    else if (average <= thresholds.high) styleIndex = 2;
    else styleIndex = 3;

    const color = [green, yellow, orange, red][styleIndex];

    const clusterIcon = createClusterIcon(color, false);

    const clusterMarker = new google.maps.Marker({
      position,
      icon: clusterIcon,
      zIndex: 1,
    });

    // Apply initial styles based on thresholds
    updateClusterStyle(clusterMarker, customMarkers, thresholds);

    // Store the reference to the cluster Marker
    clusterElementsRef.current.set(cluster, clusterMarker);

    // Add click listener to the cluster marker
    clusterMarker.addListener("click", () => {
      const clusterData = { count, position, markers } as Cluster;
      const event = new CustomEvent("cluster-click", { detail: clusterData });
      window.dispatchEvent(event);
    });

    return clusterMarker;
  },
});

// src/components/Markers/FixedMarkers/FixedMarkersRenderer.ts

import { Cluster } from "@googlemaps/markerclusterer";
import { green, orange, red, yellow } from "../../../assets/styles/colors";
// Import the custom marker interface
import { CustomMarker } from "../../../types/googleMaps";
import { createClusterIcon } from "./createMarkerIcon";

// Define the shape of thresholds
interface Thresholds {
  low: number;
  middle: number;
  high: number;
}

// Define the parameters required for the renderer
interface RendererParams {
  thresholds: Thresholds;
  pulsatingSessionId: number | null;
}

/**
 * Factory function to create a custom renderer for MarkerClusterer.
 * @param params - The parameters required for rendering clusters.
 * @returns An object with a render method conforming to MarkerClusterer's renderer interface.
 */
export const createFixedMarkersRenderer = ({
  thresholds,
  pulsatingSessionId,
}: RendererParams) => ({
  /**
   * Render function for MarkerClusterer.
   * @param cluster - The cluster to render.
   * @returns A Google Maps Marker with a custom icon.
   */
  render: ({ position, markers = [] }: Cluster) => {
    // Type assertion to ensure markers are CustomMarkers
    const customMarkers = markers as CustomMarker[];

    // Calculate the average value of the cluster
    const sum = customMarkers.reduce(
      (acc, marker) => acc + Number(marker.get("value") || 0),
      0
    );
    const average = sum / customMarkers.length;

    // Determine the style index based on the average value
    let styleIndex = 0;
    if (average < thresholds.low) styleIndex = 0;
    else if (average <= thresholds.middle) styleIndex = 1;
    else if (average <= thresholds.high) styleIndex = 2;
    else styleIndex = 3;

    // Select color based on the style index
    const color = [green, yellow, orange, red][styleIndex];

    // Check if any marker in the cluster is pulsating
    const hasPulsatingSession =
      customMarkers.length > 0 &&
      customMarkers.some((marker) => {
        const sessionId = Number(marker.get("sessionId")) || null;
        return sessionId === pulsatingSessionId;
      });

    // Create a custom cluster icon
    const clusterIcon = createClusterIcon(color, hasPulsatingSession);

    // Return a new Marker with the custom icon
    return new google.maps.Marker({
      position,
      icon: clusterIcon,
      zIndex: 1,
    });
  },
});

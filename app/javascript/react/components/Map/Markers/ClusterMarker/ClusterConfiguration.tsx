import { Cluster } from "@googlemaps/markerclusterer";
import {
  green100,
  orange100,
  red100,
  yellow100,
} from "../../../../assets/styles/colors";
import { setAverage } from "../../../../store/clusterSlice";
import { useAppDispatch } from "../../../../store/hooks";
import { CustomMarker } from "../../../../types/googleMaps";
import { Thresholds } from "../../../../types/thresholds";
import { calculateClusterAverage } from "./clusterCalculations";
import { createClusterIcon } from "./createClusterIcon";

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
}: RendererParams) => {
  const dispatch = useAppDispatch();

  return {
    render: (cluster: Cluster) => {
      const { count, position, markers = [] } = cluster;
      const customMarkers = markers as CustomMarker[];

      const average = calculateClusterAverage(customMarkers);
      dispatch(setAverage(average));

      let styleIndex = 0;
      if (average < thresholds.low) styleIndex = 0;
      else if (average <= thresholds.middle) styleIndex = 1;
      else if (average <= thresholds.high) styleIndex = 2;
      else styleIndex = 3;

      const color = [green100, yellow100, orange100, red100][styleIndex];

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
  };
};

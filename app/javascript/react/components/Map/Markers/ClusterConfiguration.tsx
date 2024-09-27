import { Cluster, ClusterStats, Renderer } from "@googlemaps/markerclusterer";

import GreenCluster from "../../../assets/icons/markers/marker-cluster-green.svg";
import OrangeCluster from "../../../assets/icons/markers/marker-cluster-orange.svg";
import RedCluster from "../../../assets/icons/markers/marker-cluster-red.svg";
import YellowCluster from "../../../assets/icons/markers/marker-cluster-yellow.svg";
import { Thresholds } from "../../../types/thresholds";

const clusterStyles = [
  {
    url: GreenCluster,
    height: 30,
    width: 30,
    textSize: 0,
  },
  {
    url: YellowCluster,
    height: 30,
    width: 30,
    textSize: 0,
  },
  {
    url: OrangeCluster,
    height: 30,
    width: 30,
    textSize: 0,
  },
  {
    url: RedCluster,
    height: 30,
    width: 30,
    textSize: 0,
  },
];

interface MarkerWithValue extends google.maps.Marker {
  get(key: string): any;
}

const calculateClusterStyleIndex = (
  markers: MarkerWithValue[],
  thresholds: Thresholds
): number => {
  if (!Array.isArray(markers) || markers.length === 0) {
    console.warn("Invalid markers array passed to calculateClusterStyleIndex");
    return 0;
  }

  const sum = markers.reduce((accumulator: number, marker: MarkerWithValue) => {
    const value = marker.get("value");
    return accumulator + (typeof value === "number" ? value : 0);
  }, 0);

  const average = sum / markers.length;

  if (average < thresholds.low) {
    return 0;
  } else if (average <= thresholds.middle) {
    return 1;
  } else if (average <= thresholds.high) {
    return 2;
  } else {
    return 3;
  }
};

export const updateClusterStyle = (
  cluster: Cluster,
  markers: MarkerWithValue[],
  thresholds: Thresholds
) => {
  const styleIndex = calculateClusterStyleIndex(markers, thresholds);
  const { url, height, width } = clusterStyles[styleIndex];

  const icon = {
    url: url,
    size: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height / 2),
    scaledSize: new google.maps.Size(width, height),
  };

  if (cluster.marker instanceof google.maps.Marker) {
    cluster.marker.setIcon(icon);
  }
};

export const customRenderer = (
  thresholds: Thresholds,
  selectedStreamId: number | null
): Renderer => ({
  render: ({ count, position }: Cluster, stats: ClusterStats) => {
    const markers = Array.isArray(stats.markers)
      ? (stats.markers as MarkerWithValue[])
      : [];
    const styleIndex = calculateClusterStyleIndex(markers, thresholds);
    const { url, height, width } = clusterStyles[styleIndex];

    const icon = {
      url: url,
      size: new google.maps.Size(width, height),
      anchor: new google.maps.Point(width / 2, height / 2),
      scaledSize: new google.maps.Size(width, height),
    };

    const marker = new google.maps.Marker({
      position: position,
      icon: icon,
      zIndex: markers.some((m) => m.get("streamId") === selectedStreamId)
        ? Number(google.maps.Marker.MAX_ZINDEX + 1)
        : undefined,
    });

    return marker;
  },
});

export const pulsatingRenderer = (
  thresholds: Thresholds,
  customPosition?: google.maps.LatLng
): Renderer => ({
  render: ({ position }: Cluster, stats: ClusterStats) => {
    const markers = Array.isArray(stats.markers)
      ? (stats.markers as MarkerWithValue[])
      : [];
    const styleIndex = calculateClusterStyleIndex(markers, thresholds);
    const { url, height, width } = clusterStyles[styleIndex];

    const icon = {
      url: url,
      size: new google.maps.Size(width, height),
      anchor: new google.maps.Point(width / 2, height / 2),
      scaledSize: new google.maps.Size(width, height),
    };

    const marker = new google.maps.Marker({
      position: customPosition || position,
      icon: icon,
      zIndex: Number(google.maps.Marker.MAX_ZINDEX + 1),
    });

    // Add pulsating effect
    const pulsate = (marker: google.maps.Marker) => {
      let opacity = 1;
      let increasing = false;

      setInterval(() => {
        if (opacity <= 0.5) {
          increasing = true;
        } else if (opacity >= 1) {
          increasing = false;
        }

        opacity += increasing ? 0.1 : -0.1;
        marker.setOpacity(opacity);
      }, 100);
    };

    pulsate(marker);

    return marker;
  },
});

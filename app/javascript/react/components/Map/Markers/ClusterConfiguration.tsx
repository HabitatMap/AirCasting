import { Cluster, Marker } from "@googlemaps/markerclusterer";

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

export const calculateClusterStyleIndex = (
  markers: google.maps.marker.AdvancedMarkerElement[],
  thresholds: Thresholds
): number => {
  const sum = markers.reduce(
    (accumulator: number, marker: google.maps.marker.AdvancedMarkerElement) => {
      return accumulator + Number(marker.title);
    },
    0
  );

  // Calculate the average
  const average = sum / markers.length;

  let styleIndex = 0;
  if (average < thresholds.low) {
    styleIndex = 0;
  } else if (average <= thresholds.middle) {
    styleIndex = 1;
  } else if (average <= thresholds.high) {
    styleIndex = 2;
  } else {
    styleIndex = 3;
  }
  return styleIndex;
};

export const customRenderer = (thresholds: Thresholds) => ({
  render: (cluster: Cluster) => {
    const { markers, count, position } = cluster;

    const styleIndex = calculateClusterStyleIndex(
      markers as google.maps.marker.AdvancedMarkerElement[],
      thresholds
    );

    const { url, height, width, textSize } = clusterStyles[styleIndex];
    const div = document.createElement("div");
    div.style.backgroundImage = `url(${url})`;
    div.style.backgroundSize = "contain";
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.fontSize = `${textSize}px`;

    const span = document.createElement("span");
    span.textContent = `${count}`;
    div.appendChild(span);

    return new google.maps.marker.AdvancedMarkerElement({
      position,
      content: div,
      title: `${count}`,
    }) as Marker;
  },
});

export const pulsatingRenderer = (
  thresholds: Thresholds,
  customPosition?: google.maps.LatLng
) => ({
  render: (cluster: Cluster) => {
    const { markers, count, position } = cluster;

    const styleIndex = calculateClusterStyleIndex(
      markers as google.maps.marker.AdvancedMarkerElement[],
      thresholds
    );

    const { url, height, width, textSize } = clusterStyles[styleIndex];
    const div = document.createElement("div");
    div.style.backgroundImage = `url(${url})`;
    div.style.backgroundSize = "contain";
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.fontSize = `${textSize}px`;

    const span = document.createElement("span");
    span.textContent = `${count}`;
    div.appendChild(span);

    div.classList.add("pulsating-marker");

    return new google.maps.marker.AdvancedMarkerElement({
      position: customPosition || position,
      content: div,
      title: `${count}`,
      zIndex: Number(google.maps.Marker.MAX_ZINDEX + 1),
    }) as Marker;
  },
});

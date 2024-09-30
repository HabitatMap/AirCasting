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

const calculateClusterStyleIndex = (
  markers: google.maps.Marker[],
  thresholds: Thresholds
): number => {
  const sum = markers.reduce(
    (accumulator: number, marker: google.maps.Marker) => {
      return accumulator + Number(marker.get("value"));
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

export const updateClusterStyle = (
  clusterElement: google.maps.Marker,
  markers: google.maps.Marker[],
  thresholds: Thresholds,
  selectedStreamId: number | null
) => {
  const styleIndex = calculateClusterStyleIndex(markers, thresholds);
  const { url, height, width, textSize } = clusterStyles[styleIndex];
  const icon = clusterElement.getIcon() as google.maps.Icon;

  if (icon && icon.url) {
    icon.url = url;
    icon.scaledSize = new google.maps.Size(width, height);
    clusterElement.setIcon(icon);
  }

  const div = clusterElement.getIcon() as unknown as HTMLElement;
  if (div) {
    div.style.fontSize = `${textSize}px`;
  }
};

export const customRenderer = (
  thresholds: Thresholds,
  clusterElementsRef: React.MutableRefObject<
    Map<Cluster, google.maps.marker.AdvancedMarkerElement>
  >
) => ({
  render: (cluster: Cluster) => {
    const { markers, count, position } = cluster;

    const styleIndex = calculateClusterStyleIndex(
      markers as google.maps.Marker[],
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

    const clusterElement = new google.maps.Marker({
      position,
      icon: div,
      title: `${count}`,
    });

    clusterElementsRef.current.set(cluster, clusterElement);

    return clusterElement;
  },
});

export const pulsatingRenderer = (
  thresholds: Thresholds,
  customPosition?: google.maps.LatLng
) => ({
  render: (cluster: Cluster) => {
    const { markers, count, position } = cluster;

    const styleIndex = calculateClusterStyleIndex(
      markers as google.maps.Marker[],
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

    return new google.maps.Marker({
      position: customPosition || position,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
          div.outerHTML
        )}`,
        scaledSize: new google.maps.Size(div.offsetWidth, div.offsetHeight),
      },
      title: `${count}`,
      zIndex: Number(google.maps.Marker.MAX_ZINDEX + 1),
    }) as Marker;
  },
});

import { Cluster, MarkerClustererOptions } from "@googlemaps/markerclusterer";
import GreenCluster from "../../../assets/icons/markers/marker-cluster-green.svg";
import OrangeCluster from "../../../assets/icons/markers/marker-cluster-orange.svg";
import RedCluster from "../../../assets/icons/markers/marker-cluster-red.svg";
import YellowCluster from "../../../assets/icons/markers/marker-cluster-yellow.svg";
import { Thresholds } from "../../../types/thresholds";

const clusterStyles = [
  { url: GreenCluster, height: 30, width: 30, textSize: 14 },
  { url: YellowCluster, height: 30, width: 30, textSize: 14 },
  { url: OrangeCluster, height: 30, width: 30, textSize: 14 },
  { url: RedCluster, height: 30, width: 30, textSize: 14 },
];

const calculateClusterStyleIndex = (
  markers: google.maps.Marker[],
  thresholds: Thresholds
): number => {
  const sum = markers.reduce(
    (acc, marker) => acc + Number(marker.getTitle()),
    0
  );
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

// Updated customRenderer with always returning a google.maps.Marker
// export const customRenderer = (
//   thresholds: Thresholds,
//   clusterElementsRef: React.MutableRefObject<Map<Cluster, google.maps.Marker>>
// ): MarkerClustererOptions["renderer"] => ({
//   render: (cluster: Cluster): google.maps.Marker => {
//     const { markers, count, position } = cluster;

//     // Ensure markers and other properties are defined and non-empty
//     if (!markers || markers.length === 0 || !position) {
//       // Returning a basic invisible marker if no markers are available, to satisfy TypeScript
//       return new google.maps.Marker({
//         position: new google.maps.LatLng(0, 0), // dummy position
//         visible: false,
//       });
//     }

//     const styleIndex = calculateClusterStyleIndex(
//       markers as google.maps.Marker[],
//       thresholds
//     );
//     const { url, height, width, textSize } = clusterStyles[styleIndex];

//     const div = document.createElement("div");
//     div.style.backgroundImage = `url(${url})`;
//     div.style.backgroundSize = "contain";
//     div.style.width = `${width}px`;
//     div.style.height = `${height}px`;
//     div.style.display = "flex";
//     div.style.alignItems = "center";
//     div.style.justifyContent = "center";
//     div.style.fontSize = `${textSize}px`;

//     const span = document.createElement("span");
//     span.textContent = `${count}`;
//     div.appendChild(span);

//     const clusterElement = new google.maps.Marker({
//       position,
//       icon: {
//         url: `data:image/svg+xml;base64,${btoa(div.outerHTML)}`,
//       },
//       title: `${count}`,
//     });

//     // Store cluster element in the reference map
//     clusterElementsRef.current.set(cluster, clusterElement);

//     return clusterElement;
//   },
// });
export const customRenderer = (
  thresholds: Thresholds,
  clusterElementsRef: React.MutableRefObject<Map<Cluster, google.maps.Marker>>
): MarkerClustererOptions["renderer"] => ({
  render: (cluster: Cluster): google.maps.Marker => {
    const { markers, count, position } = cluster;

    // Ensure markers and other properties are defined and non-empty
    if (!markers || markers.length === 0 || !position) {
      return new google.maps.Marker({
        position: new google.maps.LatLng(0, 0), // Do not render invisible markers, just skip
        visible: false,
      });
    }

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
      icon: {
        url: `data:image/svg+xml;base64,${btoa(div.outerHTML)}`,
      },
      title: `${count}`,
      visible: true, // Ensure that the marker is visible
    });

    // Store cluster element in the reference map
    clusterElementsRef.current.set(cluster, clusterElement);

    return clusterElement;
  },
});

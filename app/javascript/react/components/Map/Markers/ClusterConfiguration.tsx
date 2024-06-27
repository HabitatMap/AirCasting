import GreenCluster from "../../../assets/icons/markers/marker-cluster-green.svg";
import OrangeCluster from "../../../assets/icons/markers/marker-cluster-orange.svg";
import RedCluster from "../../../assets/icons/markers/marker-cluster-red.svg";
import YellowCluster from "../../../assets/icons/markers/marker-cluster-yellow.svg";

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

export const customRenderer = {
  render: ({
    count,
    position,
  }: {
    count: number;
    position: google.maps.LatLng;
  }) => {
    let styleIndex = 0;
    if (count > 10) {
      styleIndex = 2;
    } else if (count > 5) {
      styleIndex = 1;
    }

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
    });
  },
};

export const pulsatingRenderer = (customPosition?: google.maps.LatLng) => ({
  render: ({
    count,
    position,
  }: {
    count: number;
    position: google.maps.LatLng;
  }) => {
    let styleIndex = 0;
    if (count > 10) {
      styleIndex = 2;
    } else if (count > 5) {
      styleIndex = 1;
    }

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
    });
  },
});

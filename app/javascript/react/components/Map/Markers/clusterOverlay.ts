import { Cluster } from "@googlemaps/markerclusterer";
import { CustomMarker } from "../../../types/googleMaps";
import { Thresholds } from "../../../types/thresholds";
import { getColorForValue } from "../../../utils/thresholdColors";

export interface CustomCluster extends Cluster {
  id: string;
}

export class ClusterOverlay extends google.maps.OverlayView {
  private div: HTMLElement | null = null;
  private position: google.maps.LatLng;
  private color: string;
  private shouldPulse: boolean;
  public cluster: CustomCluster;
  private map: google.maps.Map;
  private onClick: (
    event: google.maps.MapMouseEvent,
    cluster: CustomCluster
  ) => void;
  private count: number;

  constructor(
    cluster: CustomCluster,
    color: string,
    shouldPulse: boolean,
    map: google.maps.Map,
    onClick: (event: google.maps.MapMouseEvent, cluster: CustomCluster) => void
  ) {
    super();
    this.cluster = cluster;
    this.position = cluster.position;
    this.color = color;
    this.shouldPulse = shouldPulse;
    this.map = map;
    this.onClick = onClick;
    this.count = cluster.count;
    this.setMap(map);
  }

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.cursor = "pointer";
    this.div.style.width = "30px";
    this.div.style.height = "30px";
    this.div.style.borderRadius = "50%";
    this.div.style.display = "flex";
    this.div.style.justifyContent = "center";
    this.div.style.alignItems = "center";
    this.div.style.zIndex = "1";

    this.applyStyles();

    this.div.addEventListener("click", this.handleClick);

    const panes = this.getPanes();
    if (panes) {
      panes.overlayMouseTarget.appendChild(this.div);
    }
  }

  draw() {
    if (!this.div) return;
    const overlayProjection = this.getProjection();
    const pos = overlayProjection.fromLatLngToDivPixel(this.position);
    if (pos) {
      this.div.style.left = `${pos.x - 15}px`;
      this.div.style.top = `${pos.y - 15}px`;
    }
  }

  onRemove() {
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
      this.div.removeEventListener("click", this.handleClick);
      this.div = null;
    }
  }

  private applyStyles() {
    if (!this.div) return;

    this.div.innerHTML = "";

    const outerCircle = document.createElement("div");
    outerCircle.style.width = "28px";
    outerCircle.style.height = "28px";
    outerCircle.style.borderRadius = "50%";
    outerCircle.style.border = `1px solid ${this.color}`;
    outerCircle.style.backgroundColor = "transparent";
    outerCircle.style.display = "flex";
    outerCircle.style.alignItems = "center";
    outerCircle.style.justifyContent = "center";

    const innerCircle = document.createElement("div");
    innerCircle.style.width = "14px";
    innerCircle.style.height = "14px";
    innerCircle.style.borderRadius = "50%";
    innerCircle.style.backgroundColor = this.color;
    innerCircle.style.display = "flex";
    innerCircle.style.alignItems = "center";
    innerCircle.style.justifyContent = "center";

    outerCircle.appendChild(innerCircle);
    this.div.appendChild(outerCircle);

    if (this.shouldPulse) {
      this.applyPulseAnimation();
    }
  }

  private applyPulseAnimation() {
    if (!this.div) return;

    const animationName = `pulse-animation-${this.cluster.id}`;
    const styleSheetId = `cluster-overlay-styles-${this.cluster.id}`;

    if (!document.getElementById(styleSheetId)) {
      const styleSheet = document.createElement("style");
      styleSheet.type = "text/css";
      styleSheet.id = styleSheetId;
      styleSheet.innerText = `
        @keyframes ${animationName} {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(styleSheet);
    }

    this.div.style.animation = `${animationName} 2s infinite`;
  }

  private handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.onClick(event as unknown as google.maps.MapMouseEvent, this.cluster);
  };

  public setShouldPulse(shouldPulse: boolean) {
    if (this.shouldPulse !== shouldPulse) {
      this.shouldPulse = shouldPulse;
      this.applyStyles();
    }
  }

  public updateCluster(cluster: CustomCluster, color: string) {
    this.cluster = cluster;
    this.position = cluster.position;
    this.color = color;
    this.count = cluster.count;
    this.applyStyles();
    this.draw();
  }
}

export const createFixedMarkersRenderer = ({
  thresholds,
  onClusterClick,
}: {
  thresholds: Thresholds;
  onClusterClick: (
    event: google.maps.MapMouseEvent,
    cluster: CustomCluster
  ) => void;
}): Renderer => {
  return {
    render: (
      { count, position, markers = [] }: Cluster,

      map: google.maps.Map
    ) => {
      const customMarkers = markers as CustomMarker[];

      const sum = customMarkers.reduce(
        (acc, marker) => acc + Number(marker.get("value") || 0),
        0
      );
      const average = sum / customMarkers.length;

      const color = getColorForValue(thresholds, average);

      const cluster = {
        count,
        position,
        markers,
        id: `${position.lat()}-${position.lng()}-${count}`,
      } as CustomCluster;

      const shouldPulse = customMarkers.some((marker) =>
        marker.get("shouldPulse")
      );

      const clusterOverlay = new ClusterOverlay(
        cluster,
        color,
        shouldPulse,
        map,
        onClusterClick
      );

      // Create a dummy Marker to satisfy the Renderer type
      const dummyMarker = new google.maps.Marker({ position });

      // Use the ClusterOverlay to render the cluster visually
      clusterOverlay.setMap(map);

      // Return the dummy Marker to satisfy the Renderer type
      return dummyMarker;
    },
  };
};

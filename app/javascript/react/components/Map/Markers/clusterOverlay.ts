import { CustomCluster } from "./FixedMarkers";

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
    this.setMap(map);
  }

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.transform = "translate(-50%, -100%)";
    this.div.style.cursor = "pointer";
    this.div.style.display = "flex";
    this.div.style.alignItems = "center";
    this.div.style.justifyContent = "center";
    this.div.style.borderRadius = "50%";
    this.div.style.width = "30px";
    this.div.style.height = "30px";
    this.div.style.backgroundColor = "transparent";
    this.div.style.border = "none";
    this.div.style.color = "transparent";
    this.div.style.zIndex = "1";

    this.applyStyles();

    this.div.addEventListener("click", this.handleClick);

    const panes = this.getPanes();
    if (panes) {
      if (this.shouldPulse) {
        panes.floatPane.appendChild(this.div);
      } else {
        panes.overlayMouseTarget.appendChild(this.div);
      }
    }
  }

  draw() {
    if (!this.div) return;

    const overlayProjection = this.getProjection();
    const point = overlayProjection.fromLatLngToDivPixel(this.position);

    if (point) {
      const offsetX = -14;
      const offsetY = -14;

      this.div.style.left = `${point.x + offsetX}px`;
      this.div.style.top = `${point.y + offsetY}px`;
      this.div.style.transform = "none";
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
              transform: scale(2);
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
      this.div.style.zIndex = "2";
    } else {
      this.div.style.animation = "";
    }
  }

  private handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.onClick(event as unknown as google.maps.MapMouseEvent, this.cluster);
  };

  private updatePane() {
    if (!this.div) return;
    const panes = this.getPanes();
    if (panes) {
      if (this.div.parentElement) {
        this.div.parentElement.removeChild(this.div);
      }

      if (this.shouldPulse) {
        panes.floatPane.appendChild(this.div);
      } else {
        panes.overlayLayer.appendChild(this.div);
      }
    }
  }

  public setShouldPulse(shouldPulse: boolean) {
    if (this.shouldPulse !== shouldPulse) {
      this.shouldPulse = shouldPulse;
      this.updatePane();
      this.applyStyles();
    }
  }
}

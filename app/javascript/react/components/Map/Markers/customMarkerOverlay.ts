// CustomMarkerOverlay.ts

export class CustomMarkerOverlay extends google.maps.OverlayView {
  private div: HTMLElement | null = null;
  private position: google.maps.LatLng;
  private color: string;
  private isSelected: boolean;
  private shouldPulse: boolean;
  private zIndex: number = 1000; // Default zIndex

  constructor(
    position: google.maps.LatLng,
    color: string,
    isSelected: boolean,
    shouldPulse: boolean
  ) {
    super();
    this.position = position;
    this.color = color;
    this.isSelected = isSelected;
    this.shouldPulse = shouldPulse;
  }

  public getIsSelected(): boolean {
    return this.isSelected;
  }

  public getShouldPulse(): boolean {
    return this.shouldPulse;
  }

  public getColor(): string {
    return this.color;
  }

  public setColor(color: string): void {
    this.color = color;
    this.update();
  }

  public setIsSelected(isSelected: boolean): void {
    this.isSelected = isSelected;
    this.update();
  }

  public setShouldPulse(shouldPulse: boolean): void {
    this.shouldPulse = shouldPulse;
    this.update();
  }

  /**
   * **New Method**
   * Updates the position of the marker.
   * @param position - New geographical position.
   */
  public setPosition(position: google.maps.LatLng): void {
    this.position = position;
    this.draw(); // Redraw to update position on the map
  }

  /**
   * **New Method**
   * Updates the zIndex of the marker to control stacking order.
   * @param zIndex - New zIndex value.
   */
  public setZIndex(zIndex: number): void {
    this.zIndex = zIndex;
    if (this.div) {
      this.div.style.zIndex = zIndex.toString();
    }
  }

  /** Called when the overlay is added to the map */
  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.transform = "translate(-50%, -50%)";
    this.div.style.pointerEvents = "none";
    this.div.style.cursor = "none";

    // Apply initial styles based on the overlay properties
    this.applyStyles();

    const panes = this.getPanes();
    panes && panes.overlayLayer.appendChild(this.div);
  }

  /** Draws the overlay */
  draw() {
    if (!this.div) return;
    const overlayProjection = this.getProjection();
    const pos = overlayProjection.fromLatLngToDivPixel(this.position);
    if (pos) {
      this.div.style.left = `${pos.x}px`;
      this.div.style.top = `${pos.y}px`;
      this.div.style.zIndex = this.zIndex.toString(); // Apply zIndex
    }
  }

  /** Called when the overlay is removed from the map */
  onRemove() {
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }
  }

  /** Updates the overlay's styles based on current properties */
  private applyStyles() {
    if (!this.div) return;

    const size = this.isSelected ? 44 : 36;
    const blurValue = this.isSelected ? 0 : 3;
    const opacityValue = this.isSelected ? 0.4 : 0.8;

    this.div.style.width = `${size}px`;
    this.div.style.height = `${size}px`;
    this.div.style.borderRadius = "50%";
    this.div.style.backgroundColor = this.color;
    this.div.style.opacity = `${opacityValue}`;
    this.div.style.filter = `blur(${blurValue}px)`;
    this.div.style.transition = "transform 0.3s ease-out";

    if (this.shouldPulse) {
      this.div.style.animation = `pulse-animation 2s infinite`;
    } else {
      this.div.style.animation = "";
    }
  }

  /** Updates the overlay's appearance */
  public update() {
    if (this.div) {
      this.applyStyles();
      this.draw();
    }
  }
}

// Define the keyframes once
const styleSheetId = "custom-marker-overlay-styles";
if (!document.getElementById(styleSheetId)) {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.id = styleSheetId;
  styleSheet.innerText = `
    @keyframes pulse-animation {
      0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      50% {
        transform: translate(-50%, -50%) scale(1.6);
        opacity: 0.8;
      }
      100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

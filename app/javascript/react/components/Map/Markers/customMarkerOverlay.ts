export class CustomMarkerOverlay extends google.maps.OverlayView {
  private div: HTMLElement | null = null;
  private position: google.maps.LatLng;
  private color: string;
  private isSelected: boolean;
  private shouldPulse: boolean;

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

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.transform = "translate(-50%, -50%)"; // Center the overlay
    this.div.style.pointerEvents = "none"; // Allow clicks to pass through

    // Apply styles based on the overlay properties
    this.applyStyles();

    const panes = this.getPanes();
    panes && panes.overlayLayer.appendChild(this.div);
  }

  setIsSelected(isSelected: boolean) {
    this.isSelected = isSelected;
    this.update();
  }

  setShouldPulse(shouldPulse: boolean) {
    this.shouldPulse = shouldPulse;
    this.update();
  }

  update() {
    if (this.div) {
      this.applyStyles();
    }
  }

  draw() {
    if (!this.div) return;
    const overlayProjection = this.getProjection();
    const pos = overlayProjection.fromLatLngToDivPixel(this.position);
    if (pos) {
      this.div.style.left = `${pos.x}px`;
      this.div.style.top = `${pos.y}px`;
    }
  }

  onRemove() {
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }
  }

  private applyStyles() {
    if (!this.div) return;

    const size = this.isSelected ? 44 : 36;
    const blurValue = this.isSelected ? 3 : 6;
    const opacityValue = this.isSelected ? 0.6 : 0.9;

    // Base styles
    this.div.style.width = `${size}px`;
    this.div.style.height = `${size}px`;
    this.div.style.borderRadius = "50%";
    this.div.style.backgroundColor = this.color;
    this.div.style.opacity = `${opacityValue}`;
    this.div.style.filter = `blur(${blurValue}px)`;
    this.div.style.transition = "transform 0.3s ease-out";

    // Apply pulsation if needed
    if (this.shouldPulse) {
      this.div.style.animation = `pulse-animation 2s infinite`;
    } else {
      this.div.style.animation = "";
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

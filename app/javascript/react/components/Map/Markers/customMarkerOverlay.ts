// CustomMarkerOverlay.ts

export class CustomMarkerOverlay extends google.maps.OverlayView {
  private div: HTMLElement | null = null;
  private position: google.maps.LatLng;
  private color: string;
  private isSelected: boolean;
  private shouldPulse: boolean;
  private isCluster: boolean;
  private zIndex: number = 1000; // Default zIndex

  constructor(
    position: google.maps.LatLng,
    color: string,
    isSelected: boolean,
    shouldPulse: boolean,
    isCluster: boolean = false // Default to false
  ) {
    super();
    this.position = position;
    this.color = color;
    this.isSelected = isSelected;
    this.shouldPulse = shouldPulse;
    this.isCluster = isCluster;
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

  public setIsCluster(isCluster: boolean): void {
    this.isCluster = isCluster;
    this.update();
  }

  public setPosition(position: google.maps.LatLng): void {
    this.position = position;
    this.draw();
  }

  public setZIndex(zIndex: number): void {
    this.zIndex = zIndex;
    if (this.div) {
      this.div.style.zIndex = zIndex.toString();
    }
  }

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.transform = "translate(-50%, -50%)";
    this.div.style.pointerEvents = "none";
    this.div.style.cursor = "none";

    this.applyStyles();

    const panes = this.getPanes();
    panes && panes.overlayMouseTarget.appendChild(this.div);
  }

  draw() {
    if (!this.div) return;
    const overlayProjection = this.getProjection();
    const pos = overlayProjection.fromLatLngToDivPixel(this.position);
    if (pos) {
      this.div.style.left = `${pos.x}px`;
      this.div.style.top = `${pos.y}px`;
      this.div.style.zIndex = this.zIndex.toString();
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

    // Clear existing content
    this.div.innerHTML = "";

    // Generate SVG content based on isCluster
    const svgContent = this.isCluster
      ? this.getClusterSvg()
      : this.getMarkerSvg();

    this.div.innerHTML = svgContent;

    // Apply additional styles if necessary
    this.div.style.width = this.isCluster ? "30px" : "36px";
    this.div.style.height = this.isCluster ? "30px" : "36px";
    this.div.style.pointerEvents = "none";
  }

  private getMarkerSvg(): string {
    const size = this.isSelected ? 44 : 36;
    const blurValue = this.isSelected ? 0 : 3;
    const opacityValue = this.isSelected ? 0.4 : 0.8;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${
      this.color
    }" opacity="${opacityValue}" filter="blur(${blurValue}px)" />
      </svg>
    `;
  }

  private getClusterSvg(): string {
    const size = 30;
    const baseRadius = 14;
    const center = size / 2;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle stroke="${
          this.color
        }" fill="none" cx="${center}" cy="${center}" r="${baseRadius}"></circle>
        <g fill="${this.color}">
          <rect x="${(size - 14) / 2}" y="${
      (size - 14) / 2
    }" width="14" height="14" rx="7"></rect>
        </g>
      </svg>
    `;
  }

  public update() {
    if (this.div) {
      this.applyStyles();
      this.draw();
    }
  }
}

export class CustomMarker extends google.maps.OverlayView {
  private div: HTMLDivElement | null = null;
  private position: google.maps.LatLng;
  private color: string;
  private title: string;

  constructor(
    position: google.maps.LatLngLiteral,
    color: string,
    title: string
  ) {
    super();
    this.position = new google.maps.LatLng(position);
    this.color = color;
    this.title = title;
  }

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.width = "12px";
    this.div.style.height = "12px";
    this.div.style.borderRadius = "50%";
    this.div.style.backgroundColor = this.color;
    this.div.title = this.title;

    const panes = this.getPanes();
    panes?.overlayMouseTarget.appendChild(this.div);
  }

  draw() {
    if (!this.div) return;

    const overlayProjection = this.getProjection();
    const position = overlayProjection.fromLatLngToDivPixel(this.position);

    if (position) {
      this.div.style.left = position.x - 6 + "px";
      this.div.style.top = position.y - 6 + "px";
    }
  }

  onRemove() {
    if (this.div) {
      this.div.parentNode?.removeChild(this.div);
      this.div = null;
    }
  }

  setPosition(position: google.maps.LatLngLiteral) {
    this.position = new google.maps.LatLng(position);
    this.draw();
  }

  setColor(color: string) {
    this.color = color;
    if (this.div) {
      this.div.style.backgroundColor = color;
    }
  }

  setTitle(title: string) {
    this.title = title;
    if (this.div) {
      this.div.title = title;
    }
  }
}

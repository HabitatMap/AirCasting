export class CustomMarker extends google.maps.OverlayView {
  private div: HTMLDivElement | null = null;
  private position: google.maps.LatLng;
  private color: string;
  private title: string;
  private size: number;
  private pulsating: boolean = false;
  private onClick?: () => void;

  constructor(
    position: google.maps.LatLngLiteral,
    color: string,
    title: string,
    size: number = 12,
    onClick?: () => void
  ) {
    super();
    this.position = new google.maps.LatLng(position);
    this.color = color;
    this.title = title;
    this.size = size;
    this.onClick = onClick;
  }

  setZIndex(zIndex: number) {
    if (this.div) {
      this.div.style.zIndex = zIndex.toString();
    }
  }

  setPulsating(pulsating: boolean) {
    this.pulsating = pulsating;
    if (this.div) {
      if (this.pulsating) {
        this.div.classList.add("pulsating-marker");
      } else {
        this.div.classList.remove("pulsating-marker");
      }
    }
  }

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.width = `${this.size}px`;
    this.div.style.height = `${this.size}px`;
    this.div.style.borderRadius = "50%";
    this.div.style.backgroundColor = this.color;
    this.div.title = this.title;
    this.div.style.cursor = "pointer";

    if (this.onClick) {
      this.div.addEventListener("click", this.onClick);
    }

    if (this.pulsating) {
      this.div.classList.add("pulsating-marker");
    }

    const panes = this.getPanes();
    panes?.overlayMouseTarget.appendChild(this.div);
  }

  draw() {
    if (!this.div) return;

    const overlayProjection = this.getProjection();
    const position = overlayProjection.fromLatLngToDivPixel(this.position);

    if (position) {
      const offset = this.size / 2;
      this.div.style.left = `${position.x - offset}px`;
      this.div.style.top = `${position.y - offset}px`;
    }
  }

  onRemove() {
    if (this.div) {
      if (this.onClick) {
        this.div.removeEventListener("click", this.onClick);
      }
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

  setSize(size: number) {
    this.size = size;
    if (this.div) {
      this.div.style.width = `${size}px`;
      this.div.style.height = `${size}px`;
      this.draw(); // Redraw to update position based on new size
    }
  }
}

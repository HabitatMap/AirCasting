import { gray400, white } from "../../../assets/styles/colors";

export class LabelOverlay extends google.maps.OverlayView {
  private div: HTMLElement | null = null;
  private position: google.maps.LatLng;
  private color: string;
  private value: number;
  private unitSymbol: string;
  private isSelected: boolean;
  private onClick: () => void;
  private zIndex: number;

  constructor(
    position: google.maps.LatLng,
    color: string,
    value: number,
    unitSymbol: string,
    isSelected: boolean,
    onClick: () => void,
    zIndex: number = 1000
  ) {
    super();
    this.position = position;
    this.color = color;
    this.value = value;
    this.unitSymbol = unitSymbol;
    this.isSelected = isSelected;
    this.onClick = onClick;
    this.zIndex = zIndex;
  }

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.transform = "translate(-13%, 0)";
    this.div.style.cursor = "pointer";

    this.applyStyles();

    this.div.addEventListener("click", this.onClick);

    const panes = this.getPanes();
    panes && panes.floatPane.appendChild(this.div); // Use floatPane
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
    if (this.div) {
      this.div.removeEventListener("click", this.onClick);

      if (this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
      this.div = null;
    }
  }

  public update(
    isSelected: boolean,
    color: string,
    value: number,
    unitSymbol: string
  ): void {
    this.isSelected = isSelected;
    this.color = color;
    this.value = value;
    this.unitSymbol = unitSymbol;
    this.applyStyles();
  }

  public setZIndex(zIndex: number): void {
    this.zIndex = zIndex;
    this.applyStyles();
  }

  private applyStyles() {
    if (!this.div) return;

    this.div.innerHTML = "";

    const labelContainer = document.createElement("div");
    labelContainer.style.display = "flex";
    labelContainer.style.backgroundColor = white;
    labelContainer.style.borderRadius = "10px";
    labelContainer.style.padding = "0 6px 0 4px";
    labelContainer.style.height = "20px";
    labelContainer.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
    labelContainer.style.border = this.isSelected
      ? `1px solid ${this.color}`
      : "none";
    labelContainer.style.position = "relative";
    labelContainer.style.transform = "translateY(-10px)";
    labelContainer.style.whiteSpace = "nowrap";
    labelContainer.style.alignItems = "center";
    labelContainer.style.justifyContent = "center";
    labelContainer.style.cursor = "pointer";
    labelContainer.style.zIndex = this.zIndex.toString();

    const circle = document.createElement("div");
    circle.style.width = "12px";
    circle.style.height = "12px";
    circle.style.borderRadius = "50%";
    circle.style.backgroundColor = this.color;
    circle.style.marginRight = "6px";
    circle.style.flexShrink = "0";

    const textElement = document.createElement("span");
    textElement.style.fontSize = "12px";
    textElement.style.fontWeight = "400";
    textElement.style.fontFamily = "Roboto, Arial, sans-serif";
    textElement.style.letterSpacing = "0.14px";
    textElement.style.color = gray400;
    textElement.innerText = `${Math.round(this.value)} ${this.unitSymbol}`;
    textElement.style.alignSelf = "center";

    labelContainer.appendChild(circle);
    labelContainer.appendChild(textElement);
    this.div.appendChild(labelContainer);

    labelContainer.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.15)";
  }

  public getDiv(): HTMLElement | null {
    return this.div;
  }
}

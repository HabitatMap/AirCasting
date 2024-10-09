import { gray400, white } from "../../../assets/styles/colors";
export class LabelOverlay extends google.maps.OverlayView {
  private div: HTMLElement | null = null;
  private position: google.maps.LatLng;
  private color: string;
  private value: number;
  private unitSymbol: string;
  private isSelected: boolean;
  private onClick: () => void;

  constructor(
    position: google.maps.LatLng,
    color: string,
    value: number,
    unitSymbol: string,
    isSelected: boolean,
    onClick: () => void
  ) {
    super();
    this.position = position;
    this.color = color;
    this.value = value;
    this.unitSymbol = unitSymbol;
    this.isSelected = isSelected;
    this.onClick = onClick;
  }

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.transform = "translate(-13%, 0)";
    this.div.style.cursor = "pointer"; // Make it clickable

    // Apply styles based on the overlay properties
    this.applyStyles();

    // Add click event listener
    this.div.addEventListener("click", this.onClick);

    const panes = this.getPanes();
    panes && panes.overlayMouseTarget.appendChild(this.div); // Ensure clicks are captured
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

  private applyStyles() {
    if (!this.div) return;

    // Clear existing content
    this.div.innerHTML = "";

    // Create the label container
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

    // Create the small colored circle
    const circle = document.createElement("div");
    circle.style.width = "12px";
    circle.style.height = "12px";
    circle.style.borderRadius = "50%";
    circle.style.backgroundColor = this.color;
    circle.style.marginRight = "6px";
    circle.style.flexShrink = "0";

    // Create the text element
    const textElement = document.createElement("span");

    textElement.style.fontSize = "12px";
    textElement.style.fontWeight = "400";
    textElement.style.fontFamily = "Roboto, Arial, sans-serif";
    textElement.style.letterSpacing = "0.14px";
    textElement.style.color = gray400; // You can adjust this color as needed
    textElement.innerText = `${Math.round(this.value)} ${this.unitSymbol}`;
    textElement.style.alignSelf = "center";

    // Append elements
    labelContainer.appendChild(circle);
    labelContainer.appendChild(textElement);
    this.div.appendChild(labelContainer);

    // Optional: Add a drop shadow
    labelContainer.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.15)";
  }

  // Expose div for external control if needed
  public getDiv(): HTMLElement | null {
    return this.div;
  }
}

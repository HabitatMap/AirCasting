import React from "react";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import store from "../../../store/index";

export class CustomMarker extends google.maps.OverlayView {
  private div: HTMLDivElement | null = null;
  private position: google.maps.LatLng;
  private color: string;
  private title: string;
  private size: number;
  private content?: React.ReactNode;
  private root?: Root;
  private pulsating: boolean = false;
  private onClick?: () => void;
  private clickableAreaSize: number;

  constructor(
    position: google.maps.LatLngLiteral,
    color: string,
    title: string,
    size: number = 12,
    content?: React.ReactNode,
    onClick?: () => void,
    clickableAreaSize: number = 20
  ) {
    super();
    this.position = new google.maps.LatLng(position);
    this.color = color;
    this.title = title;
    this.size = size;
    this.content = content;
    this.onClick = onClick;
    this.clickableAreaSize = clickableAreaSize;
  }

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.cursor = "pointer";
    this.div.title = this.title;
    this.div.style.width = `${this.clickableAreaSize}px`;
    this.div.style.height = `${this.clickableAreaSize}px`;

    const innerDiv = document.createElement("div");
    innerDiv.style.width = `${this.size}px`;
    innerDiv.style.height = `${this.size}px`;
    innerDiv.style.borderRadius = "50%";
    innerDiv.style.backgroundColor = this.color;
    innerDiv.style.position = "absolute";
    innerDiv.style.top = "50%";
    innerDiv.style.left = "50%";
    innerDiv.style.transform = "translate(-50%, -50%)";

    this.div.appendChild(innerDiv);

    if (this.content) {
      this.root = createRoot(this.div);
      this.root.render(<Provider store={store}>{this.content}</Provider>);
    }

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
      const offsetX = this.clickableAreaSize / 2;
      const offsetY = this.clickableAreaSize / 2;
      this.div.style.left = `${position.x - offsetX}px`;
      this.div.style.top = `${position.y - offsetY}px`;
    }
  }

  onRemove() {
    if (this.div) {
      if (this.root) {
        this.root.unmount();
        this.root = undefined;
      }
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
      const innerDiv = this.div.firstChild as HTMLDivElement;
      if (innerDiv) {
        innerDiv.style.backgroundColor = color;
      }
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
      const innerDiv = this.div.firstChild as HTMLDivElement;
      if (innerDiv) {
        innerDiv.style.width = `${size}px`;
        innerDiv.style.height = `${size}px`;
      }
    }
  }

  setClickableAreaSize(size: number) {
    this.clickableAreaSize = size;
    if (this.div) {
      this.div.style.width = `${size}px`;
      this.div.style.height = `${size}px`;
      this.draw(); // Redraw to update position based on new size
    }
  }

  getPosition(): google.maps.LatLng {
    return this.position;
  }

  getContent(): React.ReactNode | undefined {
    return this.content;
  }

  setContent(content: React.ReactNode) {
    this.content = content;
    if (this.div) {
      if (this.root) {
        this.root.render(<Provider store={store}>{this.content}</Provider>);
      } else {
        this.root = createRoot(this.div);
        this.root.render(<Provider store={store}>{this.content}</Provider>);
      }
    }
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
}

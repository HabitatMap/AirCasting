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
  private pulsating: boolean = false;
  private onClick?: () => void;
  private content?: React.ReactNode;
  private root?: Root;

  constructor(
    position: google.maps.LatLngLiteral,
    color: string,
    title: string,
    size: number = 12,
    onClick?: () => void
    content?: React.ReactNode
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
    this.content = content;
  }

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.transform = "translate(-50%, -50%)";
    this.div.style.cursor = "pointer";
    this.div.title = this.title;
    this.div.style.cursor = "pointer";

    if (this.onClick) {
      this.div.addEventListener("click", this.onClick);
    }

    if (this.pulsating) {
      this.div.classList.add("pulsating-marker");
    }

    if (this.content) {
      // Render React content into the div
      this.root = createRoot(this.div);
      this.root.render(<>{this.content}</>);
    } else {
      // Default marker styling
      this.div.style.width = `${this.size}px`;
      this.div.style.height = `${this.size}px`;
      this.div.style.borderRadius = "50%";
      this.div.style.backgroundColor = this.color;
    }

    const panes = this.getPanes();
    panes?.overlayMouseTarget.appendChild(this.div);
  }

  draw() {
    if (!this.div) return;

    const overlayProjection = this.getProjection();
    const position = overlayProjection.fromLatLngToDivPixel(this.position);

    if (position) {
      this.div.style.left = `${position.x}px`;
      this.div.style.top = `${position.y}px`;
    }
  }

  onRemove() {
    if (this.div) {
      if (this.onClick) {
        this.div.removeEventListener("click", this.onClick);
      if (this.root) {
        // Unmount React component
        this.root.unmount();
        this.root = undefined;
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
    if (this.div && !this.content) {
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
    if (this.div && !this.content) {
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
        // Update the rendered content
        this.root.render(<Provider store={store}>{this.content}</Provider>);
      } else {
        // If root doesn't exist, create it
        this.root = createRoot(this.div);
        this.root.render(<Provider store={store}>{this.content}</Provider>);
      }
    }
  }
}

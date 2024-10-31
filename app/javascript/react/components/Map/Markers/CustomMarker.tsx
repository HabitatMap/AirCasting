import React from "react";
import { unstable_batchedUpdates } from "react-dom";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import attachmentIcon from "../../../assets/icons/attachmentIcon.svg";
import { blue } from "../../../assets/styles/colors";
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
  private zIndex: number = 0;
  private paneName: keyof google.maps.MapPanes;
  private noteButtons: Map<string, HTMLButtonElement> = new Map();
  private noteInfoWindows: Map<string, google.maps.InfoWindow> = new Map();
  private notes: {
    id: string;
    latitude: number;
    longitude: number;
    text: string;
    date: string;
  }[] = [];

  constructor(
    position: google.maps.LatLngLiteral,
    color: string,
    title: string,
    size: number = 12,
    content?: React.ReactNode,
    onClick?: () => void,
    clickableAreaSize: number = 20,
    paneName: keyof google.maps.MapPanes = "overlayMouseTarget",
    notes: {
      id: string;
      latitude: number;
      longitude: number;
      text: string;
      date: string;
    }[] = []
  ) {
    super();
    this.position = new google.maps.LatLng(position);
    this.color = color;
    this.title = title;
    this.size = size;
    this.content = content;
    this.onClick = onClick;
    this.clickableAreaSize = clickableAreaSize;
    this.paneName = paneName;
    this.notes = notes;
    notes.forEach((note) => this.createNoteButton(note));
  }

  private createNoteButton(note: {
    id: string;
    latitude: number;
    longitude: number;
    text: string;
    date: string;
  }) {
    const button = document.createElement("button");
    button.style.position = "absolute";
    button.style.padding = "3px 6px";
    button.style.fontSize = "12px";
    button.style.backgroundColor = "#ffffff";
    button.style.border = `1px solid ${blue}`;
    button.style.borderRadius = "4px";
    button.style.cursor = "pointer";

    const icon = document.createElement("img");
    icon.src = attachmentIcon;
    icon.style.width = "15px";
    icon.style.height = "15px";

    button.appendChild(icon);

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showNoteInfo(note);
    });

    this.noteButtons.set(note.id, button);

    const infoWindow = new google.maps.InfoWindow({
      maxWidth: 200,
    });
    this.noteInfoWindows.set(note.id, infoWindow);
  }

  private updateNoteContent(note: { id: string; text: string; date: string }) {
    const infoWindow = this.noteInfoWindows.get(note.id);
    if (infoWindow) {
      infoWindow.setContent(this.createNoteContent(note));
    }
  }

  private createNoteContent(note: { text: string; date: string }): string {
    const dateStr = new Date(note.date).toLocaleString();
    return `<div><strong>Date:</strong> ${dateStr}<br><strong>Note:</strong> ${note.text}</div>`;
  }

  private showNoteInfo(note: {
    id: string;
    latitude: number;
    longitude: number;
    text: string;
    date: string;
  }) {
    const infoWindow = this.noteInfoWindows.get(note.id);
    const button = this.noteButtons.get(note.id);

    if (infoWindow && button) {
      this.updateNoteContent(note);

      // Get the position of the button
      const buttonRect = button.getBoundingClientRect();
      const map = this.getMap();
      const mapDiv = map instanceof google.maps.Map ? map.getDiv() : null;
      const mapRect = mapDiv ? mapDiv.getBoundingClientRect() : null;

      // Calculate the position relative to the map
      const x = mapRect
        ? buttonRect.left - mapRect.left + buttonRect.width / 2
        : 0;
      const y = mapRect ? buttonRect.top - mapRect.top : 0;

      // Convert pixel coordinates to LatLng
      const latLng = mapRect
        ? this.getProjection().fromContainerPixelToLatLng(
            new google.maps.Point(x, y)
          )
        : null;
      if (latLng) {
        infoWindow.setPosition(latLng);
        infoWindow.open(this.getMap());
      }
    }
  }

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.cursor = "pointer";
    this.div.title = this.title;
    this.div.style.width = `${this.clickableAreaSize}px`;
    this.div.style.height = `${this.clickableAreaSize}px`;
    this.div.style.zIndex = this.zIndex.toString();

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
    const pane = panes ? panes[this.paneName] : null;
    pane && pane.appendChild(this.div);

    this.noteButtons.forEach((button) => {
      this.getPanes()![this.paneName].appendChild(button);
    });
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

    this.notes.forEach((note) => {
      const notePosition = overlayProjection.fromLatLngToDivPixel(
        new google.maps.LatLng(note.latitude, note.longitude)
      )!;
      const button = this.noteButtons.get(note.id);
      if (button) {
        const buttonOffsetX = 15;
        const buttonOffsetY = 40;
        button.style.left = `${notePosition.x - buttonOffsetX}px`;
        button.style.top = `${notePosition.y - buttonOffsetY}px`;
      }
    });
  }

  onRemove() {
    if (this.div) {
      if (this.root) {
        setTimeout(() => {
          this.root?.unmount();
          this.root = undefined;
        }, 0);
      }
      if (this.onClick) {
        this.div.removeEventListener("click", this.onClick);
      }
      this.div.parentNode?.removeChild(this.div);
      this.div = null;
      this.noteButtons.forEach((button) => {
        button.parentNode?.removeChild(button);
      });
      this.noteButtons.clear();
      this.noteInfoWindows.forEach((infoWindow) => {
        infoWindow.close();
      });
      this.noteInfoWindows.clear();
    }
  }

  setPosition(position: google.maps.LatLngLiteral | google.maps.LatLng) {
    this.position =
      position instanceof google.maps.LatLng
        ? position
        : new google.maps.LatLng(position.lat, position.lng);
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
      this.draw();
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
      if (!this.root) {
        this.root = createRoot(this.div);
      }
      unstable_batchedUpdates(() => {
        this.root!.render(<Provider store={store}>{this.content}</Provider>);
      });
    }
  }

  setZIndex(zIndex: number) {
    this.zIndex = zIndex;
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

  isPulsating(): boolean {
    return this.pulsating;
  }

  setNotes(
    notes: {
      id: string;
      latitude: number;
      longitude: number;
      text: string;
      date: string;
    }[]
  ) {
    this.noteButtons.forEach((button, noteId) => {
      if (!notes.some((note) => note.id === noteId)) {
        button.parentNode?.removeChild(button);
        this.noteButtons.delete(noteId);
        const infoWindow = this.noteInfoWindows.get(noteId);
        if (infoWindow) {
          infoWindow.close();
          this.noteInfoWindows.delete(noteId);
        }
      }
    });

    notes.forEach((note) => {
      if (this.noteButtons.has(note.id)) {
        // Update existing button position and info window content
        const button = this.noteButtons.get(note.id)!;
        const position = this.getProjection().fromLatLngToDivPixel(
          new google.maps.LatLng(note.latitude, note.longitude)
        )!;
        button.style.left = `${position.x - 30}px`;
        button.style.top = `${position.y - 30}px`;
        this.updateNoteContent(note);
      } else {
        // Create new button for new note
        this.createNoteButton(note);
        this.getPanes()![this.paneName].appendChild(
          this.noteButtons.get(note.id)!
        );
      }
    });

    this.notes = notes;
    this.draw();
  }

  getNotes() {
    return this.notes;
  }
}

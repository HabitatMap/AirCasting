import React from "react";
import { unstable_batchedUpdates } from "react-dom";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import store from "../../../store/index";
import { Note } from "../../../types/note";
import { NotesPopover } from "./NotesPopover/NotesPopover";

const noteButtonOffsetX = 90;

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
  private notes: Note[];
  private noteContainers: Map<string, Root> = new Map();

  constructor(
    position: google.maps.LatLngLiteral,
    color: string,
    title: string,
    size: number = 12,
    clickableAreaSize: number = 20,
    paneName: keyof google.maps.MapPanes = "overlayMouseTarget",
    notes: Note[] = [],
    content?: React.ReactNode,
    onClick?: () => void
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
  }

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.cursor = "pointer";
    this.div.title = this.title;
    this.div.style.width = `${this.clickableAreaSize}px`;
    this.div.style.height = `${this.clickableAreaSize}px`;
    // this.div.style.zIndex = this.zIndex.toString();

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

    if (this.notes && this.notes.length > 0) {
      const markerLat = this.position.lat();
      const markerLng = this.position.lng();

      const notesAtMarkerPosition = this.notes.filter(
        (note) =>
          Math.abs(note.latitude - markerLat) < 0.0000001 &&
          Math.abs(note.longitude - markerLng) < 0.0000001
      );

      if (notesAtMarkerPosition.length > 0) {
        const noteContainer = document.createElement("div");
        noteContainer.setAttribute("data-note-container", "marker");
        noteContainer.style.position = "absolute";
        noteContainer.style.top = "-35px";
        noteContainer.style.left = "0px";

        const root = createRoot(noteContainer);
        root.render(
          <Provider store={store}>
            <NotesPopover
              notes={notesAtMarkerPosition}
              onClose={() => {
                // Handle close if needed
              }}
            />
          </Provider>
        );

        this.div.appendChild(noteContainer);
        this.noteContainers.set("marker", root);
      }
    }

    const panes = this.getPanes();
    const pane = panes ? panes[this.paneName] : null;
    pane && pane.appendChild(this.div);
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
    setTimeout(() => {
      if (this.div) {
        if (this.onClick) {
          this.div.removeEventListener("click", this.onClick);
        }
        this.div.parentNode?.removeChild(this.div);
        this.div = null;
      }

      // Clean up note containers
      this.noteContainers.forEach((root) => {
        try {
          root.unmount();
        } catch (e) {
          console.warn("Error unmounting note container:", e);
        }
      });
      this.noteContainers.clear();
    }, 0);
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

  setNotes(notes: Note[]) {
    const existingNotes = this.notes;
    this.notes = notes;

    // Schedule cleanup and update for next tick
    setTimeout(() => {
      // Clean up existing note containers
      this.noteContainers.forEach((root) => {
        try {
          root.unmount();
        } catch (e) {
          console.warn("Error unmounting note container:", e);
        }
      });
      this.noteContainers.clear();

      // Only add new note container if there are notes at this marker's position
      if (this.notes && this.notes.length > 0 && this.div) {
        const markerLat = this.position.lat();
        const markerLng = this.position.lng();

        const notesAtMarkerPosition = this.notes.filter(
          (note) =>
            Math.abs(note.latitude - markerLat) < 0.0000001 &&
            Math.abs(note.longitude - markerLng) < 0.0000001
        );

        if (notesAtMarkerPosition.length > 0) {
          const noteContainer = document.createElement("div");
          noteContainer.setAttribute("data-note-container", "marker");
          noteContainer.style.position = "absolute";
          noteContainer.style.top = "-45px";
          noteContainer.style.left = "15px";

          const root = createRoot(noteContainer);
          root.render(
            <Provider store={store}>
              <NotesPopover
                notes={notesAtMarkerPosition}
                onClose={() => {
                  // Handle close if needed
                }}
              />
            </Provider>
          );

          this.div.appendChild(noteContainer);
          this.noteContainers.set("marker", root);
        }
      }

      this.draw();
    }, 0);
  }

  cleanup() {
    if (this.div) {
      if (this.onClick) {
        this.div.removeEventListener("click", this.onClick);
      }

      // Schedule unmount for next tick
      setTimeout(() => {
        this.noteContainers.forEach((root) => {
          try {
            root.unmount();
          } catch (e) {
            console.warn("Error unmounting note container:", e);
          }
        });
        this.noteContainers.clear();

        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
        }
        this.div = null;
      }, 0);
    }
  }
}

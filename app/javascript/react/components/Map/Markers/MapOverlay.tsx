// MapOverlay.tsx
import { useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

interface MapOverlayProps {
  position: google.maps.LatLngLiteral;
  children: React.ReactNode;
}

const MapOverlay: React.FC<MapOverlayProps> = ({ position, children }) => {
  const map = useMap();
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const containerElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map) return;

    class CustomOverlay extends google.maps.OverlayView {
      div: HTMLDivElement | null = null;

      onAdd() {
        this.div = document.createElement("div");
        this.div.style.position = "absolute";
        containerElementRef.current = this.div;
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(this.div);
      }

      draw() {
        if (!this.div) return;

        const overlayProjection = this.getProjection();
        const point = overlayProjection.fromLatLngToDivPixel(
          new google.maps.LatLng(position)
        );

        if (point) {
          this.div.style.left = `${point.x}px`;
          this.div.style.top = `${point.y}px`;
          this.div.style.transform = "translate(-50%, -100%)";
        }
      }

      onRemove() {
        if (this.div) {
          this.div.parentNode?.removeChild(this.div);
          this.div = null;
          containerElementRef.current = null;
        }
      }
    }

    overlayRef.current = new CustomOverlay();
    overlayRef.current.setMap(map);

    return () => {
      overlayRef.current?.setMap(null);
      overlayRef.current = null;
    };
  }, [map, position]);

  return containerElementRef.current
    ? ReactDOM.createPortal(children, containerElementRef.current)
    : null;
};

export default MapOverlay;

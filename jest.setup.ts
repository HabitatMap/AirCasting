// jest.setup.ts
global.google = {
  maps: {
    OverlayView: class {
      onAdd(): void {}
      draw(): void {}
      onRemove(): void {}
      // Mocking the missing methods to match the OverlayView interface
      preventMapHitsAndGesturesFrom(_element: Element): void {}
      preventMapHitsFrom(_element: Element): void {}

      // If your code calls getPanes or getProjection, mock them as well
      getPanes(): { overlayLayer: HTMLElement } {
        return { overlayLayer: document.createElement("div") };
      }
      getProjection(): {
        fromLatLngToDivPixel: (latLng: google.maps.LatLng) => {
          x: number;
          y: number;
        };
      } {
        return {
          fromLatLngToDivPixel: () => ({ x: 0, y: 0 }),
        };
      }
    },
    LatLng: class {
      lat: number;
      lng: number;
      constructor(lat: number, lng: number) {
        this.lat = lat;
        this.lng = lng;
      }
    },
  },
} as unknown as typeof google; // Use a type assertion to ensure correct typing

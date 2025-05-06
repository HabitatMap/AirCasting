export function initGoogleMapsMocks() {
  (global as any).google = {
    maps: {
      Marker: class {
        static MAX_ZINDEX = 1000;
        setMap = jest.fn();
        setPosition = jest.fn();
        setVisible = jest.fn();
        getPosition = jest.fn();
        addListener = jest.fn();
      },
      OverlayView: class {
        static preventMapHitsAndGesturesFrom = jest.fn();
        static preventMapHitsFrom = jest.fn();
        setMap = jest.fn();
        draw = jest.fn();
        onAdd = jest.fn();
        onRemove = jest.fn();
        getPanes = jest.fn(() => ({
          overlayLayer: document.createElement("div"),
          overlayMouseTarget: document.createElement("div"),
          floatPane: document.createElement("div"),
          mapPane: document.createElement("div"),
        }));
      },
      LatLng: class {
        constructor(public lat: number, public lng: number) {}
        toJSON() {
          return { lat: this.lat, lng: this.lng };
        }
      },
      Point: class {
        constructor(public x: number, public y: number) {}
      },
      event: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
  };
}

// `customMarkerClass` has two responsibilities:
//   - create `Custom` after google.maps.OverlayView is loaded in the browser
//   - cache `Custom` so that it's not recreated for every custom marker
const customMarkerClass = () => {
  let klass;
  let zIndex = 10000;

  return (() => {
    if (!!klass) return klass;

    // OverlayView: https://developers.google.com/maps/documentation/javascript/customoverlays
    klass = class Custom extends google.maps.OverlayView {
      constructor({ object, content, colorClass, callback, type }) {
        super();
        this.object = object;
        this.content = content;
        this.colorClass = colorClass;
        this.callback = callback;
        this.type = type;
      }

      onAdd() {
        const marker = document.createElement("div");
        marker.classList.add(this.type);
        marker.classList.add(this.colorClass);
        marker.innerText = this.content;
        marker.addEventListener("click", this.callback);

        this.markerContainer = document.createElement("div");
        this.markerContainer.classList.add("marker-container");
        this.markerContainer.appendChild(marker);

        this.getPanes().overlayMouseTarget.appendChild(this.markerContainer);
      }

      draw() {
        var divPosition = this.getProjection().fromLatLngToDivPixel(this.getPosition());

        var display =
          Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000
            ? "block"
            : "none";

        if (display === "block") {
          this.markerContainer.style.left = divPosition.x + "px";
          this.markerContainer.style.top = divPosition.y + "px";
        }
        if (this.markerContainer.style.display !== display) {
          this.markerContainer.style.display = display;
        }
      }

      onRemove() {
        if (this.markerContainer) {
          this.markerContainer.parentNode.removeChild(this.markerContainer);
          delete this.markerContainer;
        }
      }

      hide() {
        if (this.markerContainer) {
          this.markerContainer.style.visibility = "hidden";
        }
      }

      show() {
        if (this.markerContainer) {
          this.markerContainer.style.visibility = "visible";
        }
      }

      toggle() {
        if (this.markerContainer) {
          if (this.markerContainer.style.visibility === "hidden") {
            this.show();
          } else {
            this.hide();
          }
        }
      }

      toggleDOM(map) {
        if (this.getMap()) {
          this.setMap(null);
        } else {
          this.setMap(map);
        }
      }

      getPosition() {
        return new google.maps.LatLng({
          lat: this.object.latLng.lat(),
          lng: this.object.latLng.lng(),
        });
      }

      getVisible() {
        return true;
      }

      getDraggable() {
        return false;
      }

      value() {
        return this.object.value;
      }

      streamId() {
        return this.object.streamId;
      }

      moveOnTop(index) {
        this.markerContainer.style.zIndex = zIndex;
        zIndex += 1;
      };
    }

    return klass;
  })()
}

export function buildCustomMarker({ object, content, colorClass, callback, type }) {
  const marker = new (customMarkerClass())({ object, content, colorClass, callback, type });
  window.__map.customMarkers.push(marker);
  return marker;
}

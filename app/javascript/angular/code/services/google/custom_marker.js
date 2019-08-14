export function buildCustomMarker({
  object,
  content,
  colorClass,
  callback,
  type
}) {
  const CustomMarker = function({
    object,
    content,
    colorClass,
    callback,
    type
  }) {
    this.position = object.latLng;

    const marker = document.createElement("div");
    marker.classList.add(type);
    marker.classList.add(colorClass);
    marker.innerText = content;
    marker.addEventListener("click", callback);

    this.markerContainer = document.createElement("div");
    this.markerContainer.classList.add("marker-container");
    this.markerContainer.appendChild(marker);

    this.stopEventPropagation();
  };

  CustomMarker.prototype = Object.create(google.maps.OverlayView.prototype);

  CustomMarker.prototype.onAdd = function() {
    this.getPanes().overlayMouseTarget.appendChild(this.markerContainer);
  };

  CustomMarker.prototype.onRemove = function() {
    if (this.markerContainer.parentElement) {
      this.markerContainer.parentElement.removeChild(this.markerContainer);
    }
  };

  CustomMarker.prototype.draw = function() {
    var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);

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
  };

  CustomMarker.prototype.stopEventPropagation = function() {
    var markerContainer = this.markerContainer;

    [
      "click",
      "dblclick",
      "contextmenu",
      "wheel",
      "mousedown",
      "touchstart",
      "pointerdown"
    ].forEach(function(event) {
      markerContainer.addEventListener(event, function(e) {
        e.stopPropagation();
      });
    });
  };

  // getPosition and getDraggable are required markers methods for google/markerclustererplus library
  CustomMarker.prototype.getPosition = function() {
    return new google.maps.LatLng({
      lat: this.position.lat(),
      lng: this.position.lng()
    });
  };

  CustomMarker.prototype.getDraggable = () => {};

  CustomMarker.prototype.objectId = () => object.id;

  CustomMarker.prototype.value = () => object.value;

  const marker = new CustomMarker({
    object,
    content,
    colorClass,
    callback,
    type
  });

  window.__map.markers.push(marker);

  return marker;
}

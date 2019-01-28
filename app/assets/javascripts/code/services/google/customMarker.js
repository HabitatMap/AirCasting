export function buildCustomMarker(latLng, content, colorClass, callback) {
  const CustomMarker = function(position, content, colorClass, callback) {
    this.position = position;

    this.anchor = document.createElement('div');
    this.anchor.classList.add('fixed-marker');
    this.anchor.classList.add(colorClass);
    this.anchor.innerText = content;
    this.anchor.addEventListener('click', callback);

    this.stopEventPropagation();
  };
    // NOTE: google.maps.OverlayView is only defined once the Maps API has
    // loaded. That is why CustomMarker is defined inside initMap().
  CustomMarker.prototype = Object.create(google.maps.OverlayView.prototype);

  CustomMarker.prototype.onAdd = function() {
    this.getPanes().floatPane.appendChild(this.anchor);
  };

  CustomMarker.prototype.onRemove = function() {
    if (this.anchor.parentElement) {
      this.anchor.parentElement.removeChild(this.anchor);
    }
  };

  CustomMarker.prototype.draw = function() {
    var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);

    const divCenteredPosition = this.centerMarker(divPosition)

    var display =
        Math.abs(divCenteredPosition.x) < 4000 && Math.abs(divCenteredPosition.y) < 4000 ?
        'block' :
        'none';

    if (display === 'block') {
      this.anchor.style.left = divCenteredPosition.x + 'px';
      this.anchor.style.top = divCenteredPosition.y + 'px';
    }
    if (this.anchor.style.display !== display) {
      this.anchor.style.display = display;
    }
  };

  CustomMarker.prototype.centerMarker = function(divPosition) {
    const horizontalShift = -16
    const verticalShift = -18

    return { x: divPosition.x + horizontalShift, y: divPosition.y + verticalShift }
  };

  CustomMarker.prototype.stopEventPropagation = function() {
    var anchor = this.anchor;

    ['click', 'dblclick', 'contextmenu', 'wheel', 'mousedown', 'touchstart',
     'pointerdown']
        .forEach(function(event) {
          anchor.addEventListener(event, function(e) {
            e.stopPropagation();
          });
        });
  };
  return new CustomMarker(latLng, content, colorClass, callback);
}

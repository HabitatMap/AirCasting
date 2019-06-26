import { lengthToPixels, pixelsToLength } from "./mapsUtils";
import * as basicLightbox from "basiclightbox";

let notes = [];
if (process.env.NODE_ENV !== "test") {
  var popup = new google.maps.InfoWindow();
}

export const drawNotes = (notesData, map, sessionMarker) => {
  notes = [];
  notesData.forEach(noteData => drawNote(noteData, map, sessionMarker));
  return notes.map(note => note.marker);
};

const drawNote = (data, map, sessionMarker) => {
  const marker = map.drawMarker({
    position: {
      lat: data.latitude,
      lng: data.longitude
    },
    title: data.text,
    icon: "/assets/marker_note.png",
    zIndex: 200000
  });

  notes.push({ data, marker });
  const index = notes.length - 1;
  google.maps.event.addListener(marker, "click", () => {
    show(index);
  });
};

const show = index => {
  popup.open(window.__map, notes[index].marker);
  popup.setContent(createHtml(index));
};

const createHtml = index => {
  const data = notes[index].data;
  const date = moment(data.date, "YYYY-MM-DDTHH:mm:ss").format(
    "MM/DD/YYYY, HH:mm:ss"
  );

  let photoHtml = "";

  data.photo = "http://placeimg.com/640/480/any"; // TODO tmp, remove
  data.photo_thumbnail = "http://placeimg.com/480/360/any"; // TODO tmp, remove

  if (data.photo) {
    photoHtml = `<a class="note__photo-thumbnail"><img src=${data.photo_thumbnail} alt="Note photo thumbnail" /></a>`;
  }

  return (
    `<div class="note info-window">
      <div class="note__date">
        ${date}
      </div>
      <hr>
      <div class="note__content">` +
    photoHtml +
    `<p>${data.text}</p>
      </div>
      <div class="note-pagination">
          <button class="note-pagination__arrow note-pagination__arrow--prev switchNote" id=${index -
            1}>
            <
          </button>
          <span class="note-pagination__page">
            ${index + 1} of ${notes.length}
          </span>
          <button class="note-pagination__arrow note-pagination__arrow--next switchNote" id=${index +
            1}>
            >
          </button>
        </div>
    </div>`
  );
};

if (process.env.NODE_ENV !== "test") {
  google.maps.event.addListener(popup, "domready", () => {
    google.maps.event.addListener(window.__map, "zoom_changed", () =>
      popup.close()
    );

    const thumbnail = document.querySelector(".note__photo-thumbnail");
    debugger;

    if (thumbnail) {
      thumbnail.onclick = () => {};
    }

    Array.from(document.getElementsByClassName("switchNote")).forEach(
      button => {
        button.addEventListener("click", () => {
          let index = parseInt(button.id);
          if (index < 0) index += notes.length;
          if (index >= notes.length) index -= notes.length;

          show(index);
        });
      }
    );
  });
}

const adjustedLatitude = (note, marker) => {
  const notePoint = window.__map.getProjection().fromLatLngToPoint({
    lat: () => note.latitude,
    lng: () => note.longitude
  });
  const markerPoint = window.__map.getProjection().fromLatLngToPoint(marker);

  if (noteIsHidden(notePoint, markerPoint)) {
    const adjustedPosition = window.__map.getProjection().fromPointToLatLng({
      y:
        notePoint.y -
        pixelsToLength(5, window.__map.getZoom()) -
        (notePoint.y - markerPoint.y),
      x: notePoint.x
      // Longitude increases as point.y coordinate decreases. That's why we subtract form notePoint.y to move the note up, so that it's above the marker.
    });

    return adjustedPosition.lat();
  }
  return note.latitude;
};

const noteIsHidden = (notePoint, markerPoint) => {
  const horizontalDistance = lengthToPixels(
    Math.abs(notePoint.x - markerPoint.x),
    window.__map.getZoom()
  );

  const verticalDistance = lengthToPixels(
    Math.abs(notePoint.y - markerPoint.y),
    window.__map.getZoom()
  );

  return horizontalDistance < 40 && verticalDistance < 5;
};

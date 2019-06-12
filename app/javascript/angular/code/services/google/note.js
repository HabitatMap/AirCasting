import { createObserver } from "../../../../createObserver.js";

let noteMarkers = [];

var popup = new google.maps.InfoWindow();

google.maps.event.addListener(popup, "domready", () => {
  document
    .getElementById("testId")
    .addEventListener("click", event => console.warn(event));
});

export function drawNotes(notes, map) {
  noteMarkers = [];
  notes.forEach(note => {
    noteMarkers.push(drawNote(note, notes.length, map));
  });
  return noteMarkers;
}

function drawNote(note, notesCount, map) {
  var marker = map.drawMarker({
    position: { lat: note.latitude, lng: note.longitude },
    title: note.text,
    icon: "/assets/marker_note.png",
    zIndex: 200000
  });

  google.maps.event.addListener(marker, "click", function() {
    show(note, marker, notesCount, map);
  });
  return marker;
}

function show(note, relatedMarker, notesCount, map) {
  popup.open(map.get(), relatedMarker);

  popup.setContent(createHtml(note, notesCount));
}

function createHtml(note, total) {
  const date = moment(note.date, "YYYY-MM-DDTHH:mm:ss").format(
    "MM/DD/YYYY, HH:mm:ss"
  );

  let photoHtml = "";
  if (note.photo) {
    photoHtml = `<a href=${note.photo} visibility=hidden lightbox>
     <div class="photo">
        <img src=${note.photo_thumbnail} />
      </div>
    </a>`;
  }

  const html =
    `<div class="note-window">
      <div class="header">
        <span class="date">${date}</span>
        <div class="right">` +
    `<button id="testId"> < </button>` +
    `<span class=number>${note.number} of ${total}</span>
          <button> > </button>
        </div>
      </div>
      <div class="content">` +
    photoHtml +
    `<p>${note.text}</p>
      </div>
    </div>`;

  return html;
}

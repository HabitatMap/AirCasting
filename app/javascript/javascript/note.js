let notes = [];
if (process.env.NODE_ENV !== "test") {
  var popup = new google.maps.InfoWindow();
}

export function drawNotes(notesData, map) {
  notes = [];
  notesData.forEach(noteData => {
    const marker = drawNote(noteData, map);

    notes.push({ data: noteData, marker });
  });
  return notes.map(note => note.marker);
}

function drawNote(data, map) {
  const marker = map.drawMarker({
    position: { lat: data.latitude, lng: data.longitude },
    title: data.text,
    icon: "/assets/marker_note.png",
    zIndex: 200000
  });

  google.maps.event.addListener(marker, "click", () => {
    show(data, marker);
  });
  return marker;
}

function show(data, relatedMarker) {
  popup.open(window.__map, relatedMarker);

  popup.setContent(createHtml(data));
}

function createHtml(data) {
  const date = moment(data.date, "YYYY-MM-DDTHH:mm:ss").format(
    "MM/DD/YYYY, HH:mm:ss"
  );

  let photoHtml = "";
  if (data.photo) {
    photoHtml = `<a href=${data.photo} visibility=hidden lightbox>
     <div class="photo">
        <img src=${data.photo_thumbnail} />
      </div>
    </a>`;
  }

  const html =
    `<div class="note-window">
      <div class="header">
        <span class="date">${date}</span>
        <div class="right">
          <button class="prevNote" id=${data.number - 1}> < </button>
          <span class=number>${data.number} of ${notes.length}</span>
          <button class="nextNote" id=${data.number - 1}> > </button>
        </div>
      </div>
    <div class="content">` +
    photoHtml +
    `<p>${data.text}</p>
      </div>
    </div>`;

  return html;
}

if (process.env.NODE_ENV !== "test") {
  google.maps.event.addListener(popup, "domready", () => {
    const prevNoteButton = document.getElementsByClassName("prevNote")[0];
    let prevNoteId = parseInt(prevNoteButton.id) - 1;
    if (prevNoteId < 0) {
      prevNoteId += notes.length;
    }

    prevNoteButton.addEventListener("click", () => {
      show(notes[prevNoteId].data, notes[prevNoteId].marker);
    });

    const nextNoteButton = document.getElementsByClassName("nextNote")[0];
    let nextNoteId = parseInt(nextNoteButton.id) + 1;
    if (nextNoteId >= notes.length) {
      nextNoteId -= notes.length;
    }

    nextNoteButton.addEventListener("click", () => {
      show(notes[nextNoteId].data, notes[nextNoteId].marker);
    });
  });
}

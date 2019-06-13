let notes = [];
if (process.env.NODE_ENV !== "test") {
  var popup = new google.maps.InfoWindow();
}

export const drawNotes = (notesData, map) => {
  notes = [];
  notesData.forEach(noteData => drawNote(noteData, map));
  return notes.map(note => note.marker);
};

const drawNote = (data, map) => {
  const marker = map.drawMarker({
    position: { lat: data.latitude, lng: data.longitude },
    title: data.text,
    icon: "/assets/marker_note.png",
    zIndex: 200000
  });

  notes.push({ data, marker });
  const idx = notes.length - 1;
  google.maps.event.addListener(marker, "click", () => {
    show(idx);
  });
};

const show = idx => {
  popup.open(window.__map, notes[idx].marker);
  popup.setContent(createHtml(idx));
};

const createHtml = idx => {
  const data = notes[idx].data;
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

  return (
    `<div class="note-window">
      <div class="header">
        <span class="date">${date}</span>
        <div class="right">
          <button class="switchNote" id=${idx - 1}> < </button>
          <span class=number>${data.number} of ${notes.length}</span>
          <button class="switchNote" id=${idx + 1}> > </button>
        </div>
      </div>
    <div class="content">` +
    photoHtml +
    `<p>${data.text}</p>
      </div>
    </div>`
  );
};

const numberToIndex = number => number - 1;

if (process.env.NODE_ENV !== "test") {
  google.maps.event.addListener(popup, "domready", () => {
    const switchNoteButtonsObj = document.getElementsByClassName("switchNote");

    const switchNoteButtons = [
      switchNoteButtonsObj[0],
      switchNoteButtonsObj[1]
    ];

    switchNoteButtons.forEach(button => {
      button.addEventListener("click", () => {
        let idx = parseInt(button.id);
        if (idx < 0) idx += notes.length;
        if (idx >= notes.length) idx -= notes.length;

        show(idx);
      });
    });
  });
}

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
          <button class="switchNote" id=${index - 1}> < </button>
          <span class=number>${data.number} of ${notes.length}</span>
          <button class="switchNote" id=${index + 1}> > </button>
        </div>
      </div>
    <div class="content">` +
    photoHtml +
    `<p>${data.text}</p>
      </div>
    </div>`
  );
};

if (process.env.NODE_ENV !== "test") {
  google.maps.event.addListener(popup, "domready", () => {
    google.maps.event.addListener(window.__map, "zoom_changed", () =>
      popup.close()
    );

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

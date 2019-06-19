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
    photoHtml = `<a class="note__photo" id="note__photo" href=${data.photo} visibility=hidden target="_blank">
      <img src=${data.photo_thumbnail} />
    </a>`;
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
            ${data.number} of ${notes.length}
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

    const photo = document.getElementById("note__photo");
    if (photo) {
      $(photo).lightBox();
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

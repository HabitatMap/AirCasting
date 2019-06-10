angular.module("google").factory("note", [
  "$compile",
  "$rootScope",
  "$timeout",
  "map",
  function($compile, $rootScope, $timeout, map) {
    var Note = function() {
      this.popup = new google.maps.InfoWindow();
      this.noteMarkers = [];
      map.addListener("zoom_changed", _(this.hide).bind(this));
    };
    Note.prototype = {
      get: function() {
        return this.popup;
      },
      show: function(note, relatedMarker, notesCount) {
        this.popup.open(map.get(), relatedMarker);
        this.data = note;
        console.warn(note);
        var self = this;

        var element = createHtml(note, notesCount, this.showPrevious);

        $timeout(function() {
          $compile(element[0])($rootScope);
          self.popup.setContent(element[0]);
        });
      },
      hide: function() {
        this.popup.close();
      },
      drawNote: function(note, notesCount) {
        var self = this;
        var marker = map.drawMarker({
          position: { lat: note.latitude, lng: note.longitude },
          title: note.text,
          icon: "/assets/marker_note.png",
          zIndex: 200000
        });

        google.maps.event.addListener(marker, "click", function() {
          self.show(note, marker, notesCount);
        });
        return marker;
      },

      drawNotes: function(notes) {
        notesMarkers = [];
        notes.forEach(note => {
          notesMarkers.push(this.drawNote(note, notes.length));
        });
        return notesMarkers;
      },
      showPrevious: function() {
        console.warn("prev");
      }
    };

    return new Note();
  }
]);

const createHtml = (note, total, showPrevious) => {
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

  return $(
    `<div class="note-window">
      <div class="header">
        <span class="date">${date}</span>
        <div class="right">
          <button onclick=${showPrevious()}> previous </button>
          <span class=number>${note.number} of ${total}</span>
          <button>></button>
        </div>
      </div>
      <div class="content">` +
      photoHtml +
      `<p>${note.text}</p>
      </div>
    </div>`
  );
};

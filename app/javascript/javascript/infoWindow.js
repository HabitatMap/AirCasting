import constants from "./constants";
import {
  savePosition,
  mapObj,
  getSavedPosition,
  setHasChangedProgrammatically,
} from "./mapsUtils";
import heat from "./heat";
import sensors from "./sensors";
import { get } from "./http";
import _ from "underscore";
import map from "./map";

let first = true;

const infoWindow = () => {
  var InfoWindow = function () {
    this.popup = new google.maps.InfoWindow();
  };

  InfoWindow.prototype = {
    get: function () {
      return this.popup;
    },

    show: function ({ url, params, position, sessionType }) {
      if (first) savePosition();
      first = false;

      this.popup.setContent("fetching...");
      this.popup.setPosition(position);
      this.popup.setOptions({ disableAutoPan: true });
      this.popup.open(mapObj());

      const promise =
        params.stream_ids.length > 100
          ? Promise.resolve(null)
          : get(url, params);
      promise.then((data) => this.onShowData(data, sessionType));
    },

    onShowData: function (data, sessionType) {
      const html = this.htmlFor(data, sessionType);
      this.popup.setContent(html);
      setHasChangedProgrammatically(true);

      this.popup.setOptions({ disableAutoPan: false });
      this.popup.open(mapObj());

      google.maps.event.addListenerOnce(this.popup, "closeclick", function () {
        map.fitBounds(getSavedPosition().bounds, getSavedPosition().zoom);
        first = true;
      });

      document.getElementById("info-window__link") &&
        document
          .getElementById("info-window__link")
          .addEventListener("click", () => map.zoomToSelectedCluster());

      map.addListener("zoom_changed", _(this.hide).bind(this));
    },

    hide: function () {
      this.popup.close();
      first = true;
    },

    htmlFor: function (data, sessionType) {
      if (!data) {
        return `
          <div class="info-window">
            <div>Contains more than 100 sessions</div>
            <hr>
            <a id="info-window__link" class="info-window__link">zoom in and show sessions →</a>
          </div>
        `;
      }

      return sessionType === constants.fixedSession
        ? `
              <div class="info-window">
                <div class="info_window__avg-color ${heat.classByValue(
                  data.average
                )}"></div>
                <p class="info-window__avg">last hr avg. <strong>${Math.round(
                  data.average
                )}</strong> ${sensors.selected().unit_symbol}</p>
                <hr>
                <ul class="info-window__list">
                  <li>${data.number_of_instruments} instruments</li>
                  <li>${data.number_of_samples} measurements</li>
                  <li>${data.number_of_contributors} contributors</li>
                  <a id="info-window__link" class="info-window__link">zoom in and show sessions →</a>
                </ul>
              </div>
              `
        : `
              <div class="info-window">
                <div class="info_window__avg-color ${heat.classByValue(
                  data.average
                )}"></div>
                <p class="info-window__avg">avg. <strong>${Math.round(
                  data.average
                )}</strong> ${sensors.selected().unit_symbol}</p>
                <hr>
                <ul class="info-window__list">
                  <li>${data.number_of_samples} measurements</li>
                  <li>${data.number_of_contributors} contributors</li>
                </ul>
              </div>
              `;
    },
  };

  return new InfoWindow();
};

export default infoWindow();

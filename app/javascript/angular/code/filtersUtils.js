import tippy from "tippy.js";
import Clipboard from "clipboard";
import moment from "moment";

export const endOfToday = () =>
  moment()
    .utc()
    .endOf("day")
    .format("X");

export const oneYearAgo = () =>
  moment()
    .utc()
    .startOf("day")
    .subtract(1, "year")
    .format("X");

export const presentMoment = () =>
  moment()
    .utc()
    .format("X");

export const oneHourAgo = () =>
  moment()
    .utc()
    .subtract(1, "hour")
    .format("X");

export const setupTimeRangeFilter = (callback, timeFrom, timeTo) => {
  if (document.getElementById("time-range")) {
    $("#time-range").daterangepicker(
      {
        linkedCalendars: false,
        timePicker: true,
        timePicker24Hour: true,
        startDate: moment
          .unix(timeFrom)
          .utc()
          .format("MM/DD/YYYY HH:mm"),
        endDate: moment
          .unix(timeTo)
          .utc()
          .format("MM/DD/YYYY HH:mm"),
        locale: {
          format: "MM/DD/YYYY HH:mm"
        }
      },
      function(timeFrom, timeTo) {
        timeFrom = timeFrom.utcOffset(0, true).unix();
        timeTo = timeTo.utcOffset(0, true).unix();

        callback(timeFrom, timeTo);
      }
    );
  } else {
    window.setTimeout(setupTimeRangeFilter(callback, timeFrom, timeTo), 100);
  }
};

export const setupAutocomplete = (callback, id, path) => {
  if (document.getElementById(id)) {
    $(`#${id}`).autocomplete({
      source: function(request, response) {
        const data = { q: request.term, limit: 10 };
        $.getJSON(path, data, response);
      },
      select: function(event, ui) {
        callback(ui.item.value);
      }
    });
  } else {
    window.setTimeout(setupAutocomplete(callback, id, path), 100);
  }
};

export const setupClipboard = () => {
  new Clipboard("#copy-link-button");
};

export const tooltipInstance = tooltipId =>
  tippy(`#${tooltipId}`, {
    animateFill: false,
    interactive: true,
    trigger: "manual"
  })[0];

export const fetchShortUrl = (tooltipId, currentUrl) => {
  const tooltip = tooltipInstance(tooltipId);

  tooltip.setContent("Fetching...");
  tooltip.show();

  fetch("api/short_url?longUrl=" + currentUrl)
    .then(response => response.json())
    .then(json => updateTooltipContent(json.short_url, tooltip))
    .catch(err => {
      console.warn("Couldn't fetch shorten url: ", err);
      updateTooltipContent(currentUrl, tooltip);
    });
};

const updateTooltipContent = (link, tooltip) => {
  const content = `
    <input value=${link}></input>
    <button
      id='copy-link-button'
      data-clipboard-text=${link}
    >
      Copy
    </button>
  `;

  tooltip.setContent(content);

  document.getElementById("copy-link-button").addEventListener("click", () => {
    tooltip.setContent("Copied!");

    window.setTimeout(tooltip.destroy, 1000);
  });
};

export const findLocation = (location, params, map) => {
  params.update({ data: { location: location } });
  map.goToAddress(location);
};

export const clearLocation = (elmAction, params) => {
  elmAction.send(null);
  params.update({ data: { location: "" } });
};

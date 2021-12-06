import Clipboard from "clipboard";
import moment from "moment";
import tippy from "tippy.js";

export const endOfToday = () => moment().utc().endOf("day").format("X");

export const oneYearAgo = () =>
  moment().utc().startOf("day").subtract(1, "year").format("X");

const humanTime = (time) => moment.unix(time).utc().format("MM/DD/YY HH:mm");

export const daterangepickerConfig = (timeFrom, timeTo) => ({
  linkedCalendars: false,
  timePicker: true,
  timePicker24Hour: true,
  startDate: humanTime(timeFrom),
  endDate: humanTime(timeTo),
  locale: {
    format: "MM/DD/YY HH:mm",
  },
});

export const setTimerangeButtonText = (timeFrom, timeTo) => {
  $(".js--time-range-button").html(
    humanTime(timeFrom) + " - " + humanTime(timeTo)
  );
};

export const setupTimeRangeFilter = (
  onTimeRangeChanged,
  timeFrom,
  timeTo,
  onIsVisibleChange
) => {
  if (
    document.getElementById("time-range") &&
    document.getElementById("time-range-button")
  ) {
    $(".js--time-range").daterangepicker(
      daterangepickerConfig(timeFrom, timeTo),
      function (timeFrom, timeTo) {
        timeFrom = timeFrom.utcOffset(0, true).unix();
        timeTo = timeTo.utcOffset(0, true).unix();

        onTimeRangeChanged(timeFrom, timeTo);
      }
    );

    $(".js--time-range").on("show.daterangepicker", () =>
      onIsVisibleChange(true)
    );
    $(".js--time-range").on("hide.daterangepicker", () =>
      onIsVisibleChange(false)
    );

    $(".js--time-range-button").daterangepicker(
      daterangepickerConfig(timeFrom, timeTo),
      function (timeFrom, timeTo) {
        onTimeRangeChanged(
          timeFrom.utcOffset(0, true).unix(),
          timeTo.utcOffset(0, true).unix()
        );
      }
    );

    // update value of the default time range input when setting date via button
    $(".js--time-range-button").on(
      "apply.daterangepicker",
      (_, mobilePicker) => {
        const newStartDate = mobilePicker.startDate;
        const newEndDate = mobilePicker.endDate;

        const desktopPicker = $(".js--time-range").data("daterangepicker");
        desktopPicker.setStartDate(newStartDate);
        desktopPicker.setEndDate(newEndDate);
      }
    );

    $(".js--time-range").on("apply.daterangepicker", (_, desktopPicker) => {
      const newStartDate = desktopPicker.startDate;
      const newEndDate = desktopPicker.endDate;

      const mobilePicker = $(".js--time-range-button").data("daterangepicker");
      mobilePicker.setStartDate(newStartDate);
      mobilePicker.setEndDate(newEndDate);
    });

    setTimerangeButtonText(timeFrom, timeTo);
  } else {
    window.setTimeout(
      setupTimeRangeFilter(
        onTimeRangeChanged,
        timeFrom,
        timeTo,
        onIsVisibleChange
      ),
      100
    );
  }
};
export const setupTagsAutocomplete = (callback, path, createParams) => {
  if (document.getElementById("tags")) {
    $(".js--tags-input")
      .autocomplete({
        source: function (request, response) {
          const data = {
            q: { input: request.term, ...createParams() },
          };
          $.getJSON(path, data, response);
        },
        select: function (event, ui) {
          callback(ui.item.value);
        },
        minLength: 0,
      })
      .focus(function () {
        $(this).autocomplete("search");
      });
  } else {
    window.setTimeout(setupTagsAutocomplete(callback, path), 100);
  }
};

export const setupProfileNamesAutocomplete = (callback) => {
  if (document.getElementById("profile-names")) {
    $(".js--profile-names-input").autocomplete({
      source: function (request, response) {
        const data = {
          q: { input: request.term },
        };
        $.getJSON("api/autocomplete/usernames", data, response);
      },
      select: function (event, ui) {
        callback(ui.item.value);
      },
    });
  } else {
    window.setTimeout(setupProfileNamesAutocomplete(callback), 100);
  }
};

export const setupClipboard = () => {
  new Clipboard("#copy-link-button");
};

const tooltipInstance = (() => {
  let instance;

  return (tooltipId) => {
    const oldInstance = instance;
    instance =
      tippy(`#${tooltipId}`, {
        appendTo: document.body,
        allowHTML: true,
        interactive: true,
        theme: "light-border",
        trigger: "manual",
      })[0] || oldInstance;

    return instance;
  };
})();

export const fetchShortUrl = (tooltipId, currentUrl) => {
  const tooltip = tooltipInstance(tooltipId);

  tooltip.setContent("Fetching...");
  tooltip.show();

  fetch("api/short_url?longUrl=" + currentUrl)
    .then((response) => response.json())
    .then((json) => updateTooltipContent(json.short_url, tooltip))
    .catch((err) => {
      console.warn("Couldn't fetch shorten url: ", err);
      updateTooltipContent(currentUrl, tooltip);
    });
};

const updateTooltipContent = (link, tooltip) => {
  const content = `
    <input class="input" value=${link}></input>
    <button
      id='copy-link-button'
      class='button button--primary copy-link-button'
      data-clipboard-text=${link}
    >
      copy
    </button>
  `;

  tooltip.setContent(content);

  document.getElementById("copy-link-button").addEventListener("click", () => {
    tooltip.setContent("Copied!");

    window.setTimeout(tooltip.hide, 1000);
  });
};

export const clearLocation = (callback, params) => {
  callback(null);
  params.update({ data: { location: "" } });
};

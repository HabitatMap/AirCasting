import tippy from 'tippy.js';
import Clipboard from 'clipboard';

export const setupTimeRangeFilter = (elmApp, sessions, callback, timeFrom, timeTo) => {
  if (document.getElementById("daterange")) {
    $('#daterange').daterangepicker({
      opens: 'left',
      linkedCalendars: false,
      timePicker: true,
      timePicker24Hour: true,
      startDate: moment.unix(timeFrom).utc().format('MM/DD/YYYY HH:mm'),
      endDate: moment.unix(timeTo).utc().format('MM/DD/YYYY HH:mm'),
      locale: {
        format: 'MM/DD/YYYY HH:mm'
      }
    }, function(timeFrom, timeTo) {
      timeFrom = timeFrom.utcOffset(0, true).unix();
      timeTo = timeTo.utcOffset(0, true).unix();

      elmApp.ports.timeRangeSelected.send({
        timeFrom: timeFrom,
        timeTo: timeTo
      });

      callback(timeFrom, timeTo);
    });
  } else {
    window.setTimeout(setupTimeRangeFilter(elmApp, sessions, callback, timeFrom, timeTo), 100);
  };
};

export const setupAutocomplete = (callback, id, path) => {
  if (document.getElementById(id)) {
    $( "#" + id )
      .bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.ENTER ) {
          $( this ).data( "autocomplete" ).close(event);
        }
      })
      .autocomplete({
        source: function( request, response ) {
          const data = {q: request.term, limit: 10};
          $.getJSON( path, data, response );
        },
        select: function( event, ui) {
          callback(ui.item.value);
        }
      });
  } else {
    window.setTimeout(setupAutocomplete(callback, id, path), 100);
  };
};
export const setupClipboard = () => {
  new Clipboard('#copy-link-button');
};

export const tooltipInstance = () => {
  return tippy('#copy-link-tooltip', {
    trigger: 'manual',
    interactive: true,
  })[0];
};

export const fetchShortUrl = (currentUrl, tooltip) => {
  tooltip.setContent('Fetching...');
  tooltip.show();

  fetch('api/short_url?longUrl=' + currentUrl)
    .then(response => response.json())
    .then(json => updateTooltipContent(json.short_url, tooltip))
    .catch(err => {
      console.warn('Couldn\'t fetch shorten url: ', err);
      updateTooltipContent(currentUrl, tooltip)
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
  `
  tooltip.setContent(content);

  document.getElementById('copy-link-button').addEventListener('click', () => {
    tooltip.set({
      content: 'Copied!',
      animation: 'fade',
    });
    tooltip.hide(1000)
  });
};

import { keysToLowerCase } from "./utils";
import moment from "moment";
import { getQ } from "./http";
import _ from "underscore";
import params from "./params2";

const sessionsDownloader = () => {
  var fetch = function (url, reqData, sessions, refreshSessionsCallback) {
    var successCallback = function (data) {
      // data is cached so better not mutate it
      data = JSON.parse(JSON.stringify(data));
      preprocessData(data.sessions, sessions);
      refreshSessionsCallback(data.fetchableSessionsCount);
    };
    fetchPage(url, reqData, successCallback);
  };

  var fetchPage = function (url, reqData, success) {
    getQ(url, reqData).then(success);
  };

  var preprocessData = function (data, sessions) {
    var times;

    _(data).each(function (session) {
      if (session.start_time_local && session.end_time_local) {
        session.startTime = moment(session.start_time_local).utc().valueOf();
        session.endTime = moment(session.end_time_local).utc().valueOf();
      }

      session.streams = keysToLowerCase(session.streams);

      session.shortTypes = _(session.streams)
        .chain()
        .map(function (stream) {
          return {
            name: stream.measurement_short_type,
            type: stream.sensor_name,
          };
        })
        .sortBy(function (shortType) {
          return shortType.name.toLowerCase();
        })
        .value();
    });
    sessions.push.apply(sessions, data);

    sessions = sessions.sort((a, b) =>
      b.end_time_local.localeCompare(a.end_time_local)
    );

    if (!params.isSessionSelected()) {
      params.update({ fetchedSessionsCount: sessions.length });
    }

    sessions.forEach((session) => session.stream = Object.values(session.streams)[0])
  };

  return fetch;
};

export default sessionsDownloader();

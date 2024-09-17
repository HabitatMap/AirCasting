// indoorSessionsHelpers.ts

import { IndoorSession, SessionList } from "../types/sessionType";

// Function to get the list of indoor sessions
export const getIndoorSessionsList = (
  sessions: IndoorSession[]
): SessionList[] => {
  return sessions.map(
    ({ id, title, startTimeLocal, endTimeLocal, streams }) => {
      const firstStreamKey = Object.keys(streams)[0];
      const firstStream = firstStreamKey ? streams[firstStreamKey] : undefined;

      return {
        id,
        title,
        sensorName: firstStream?.sensorName || "",
        averageValue: firstStream?.streamDailyAverage || 0,
        startTime: startTimeLocal,
        endTime: endTimeLocal,
        streamId: firstStream?.id || 0,
      };
    }
  );
};

// Function to get the points for indoor sessions (for markers)
export const getIndoorSessionsPoints = (sessions: IndoorSession[]) => {
  return sessions.map(
    ({
      id,
      lastMeasurementValue,
      title,
      startTimeLocal,
      endTimeLocal,
      streams,
    }) => {
      const firstStreamKey = Object.keys(streams)[0];
      const firstStream = firstStreamKey ? streams[firstStreamKey] : undefined;

      return {
        id,
        title,
        sensorName: firstStream?.sensorName || "",
        startTime: startTimeLocal,
        endTime: endTimeLocal,
        lastMeasurementValue,
        // Include any other properties needed for markers
      };
    }
  );
};

interface Session {
  id: number;
  title: string;
  sensorName: string;
  startTime: string;
  endTime: string;
  lastMeasurementValue: number;
  point: {
    lat: number;
    lng: number;
    streamId: string;
  };
  streams: {
    sensor_name: {
      id: number;
    };
  };
}

interface TimelapseResponse {
  [timestamp: string]: { [streamId: string]: number }[];
}

interface CombinedData {
  [timestamp: string]: Session[];
}

export function combineTimelapseWithFixedSessions(
  fixedSessions: Session[],
  timelapseResponse: TimelapseResponse
): CombinedData {
  const sessionMap = new Map<string, Session>();

  // Create a map of streamId to fixed session data
  fixedSessions.forEach((session) => {
    sessionMap.set(session.point.streamId, session);
  });

  const combinedData: CombinedData = {};

  // Iterate over the timelapse response
  Object.keys(timelapseResponse).forEach((timestamp) => {
    const sessionDataAtTimestamp = timelapseResponse[timestamp];

    // Prepare an array to hold the combined sessions for this timestamp
    const sessionsForTimestamp: Session[] = [];

    sessionDataAtTimestamp.forEach((streamData) => {
      // Each streamData is an object with a single key-value pair
      const streamId = Object.keys(streamData)[0];
      const lastMeasurementValue = streamData[streamId];

      // Find the corresponding fixed session using the streamId
      const session = sessionMap.get(streamId);

      if (session) {
        // Create a copy of the session and update the lastMeasurementValue
        const updatedSession = {
          ...session,
          lastMeasurementValue,
        };

        // Add the updated session to the list for this timestamp
        sessionsForTimestamp.push(updatedSession);
      }
    });

    // Add the combined sessions to the result under the correct timestamp
    combinedData[timestamp] = sessionsForTimestamp;
  });

  return combinedData;
}

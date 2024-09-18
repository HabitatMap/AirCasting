import { FixedSession } from "../api/fixedSessionsApi";
import { Session, SessionList } from "../types/sessionType";

interface TransformedSession {
  id: number;
  title: string;
  sensorName: string;
  lastMeasurementValue: number;
  startTime: string;
  endTime: string;
  averageValue: number;
  point: {
    lat: number;
    lng: number;
    streamId: string;
  };
  streamId: number;
}

export const transformSessionData = (
  sessions: FixedSession[]
): TransformedSession[] =>
  sessions
    .filter(Boolean)
    .map(
      ({
        id,
        title,
        lastMeasurementValue,
        startTimeLocal,
        endTimeLocal,
        latitude,
        longitude,
        streams,
      }) => {
        const firstStreamKey = Object.keys(streams)[0];
        const firstStream: {
          sensorName?: string;
          streamDailyAverage?: number;
          id?: number;
        } = firstStreamKey ? streams[firstStreamKey] : {};
        return {
          id,
          title,
          sensorName: firstStream.sensorName ?? "",
          lastMeasurementValue,
          startTime: startTimeLocal,
          endTime: endTimeLocal,
          averageValue: firstStream.streamDailyAverage ?? 0,
          point: {
            lat: latitude,
            lng: longitude,
            streamId: firstStream.id?.toString() ?? "0",
          },
          streamId: firstStream.id ?? 0,
        };
      }
    );

export const getFixedSessionsPoints = (sessions: FixedSession[]): Session[] => {
  const transformedSessions = transformSessionData(sessions);
  return transformedSessions.map(
    ({
      id,
      title,
      sensorName,
      lastMeasurementValue,
      startTime,
      endTime,
      point,
    }) => ({
      id,
      title,
      sensorName,
      startTime,
      endTime,
      lastMeasurementValue,
      point,
    })
  );
};

export const getFixedSessionsList = (
  sessions: FixedSession[]
): SessionList[] => {
  if (!sessions || sessions.length === 0) {
    return [];
  }
  const transformedSessions = transformSessionData(sessions);
  return transformedSessions.map(
    ({
      id,
      title,
      sensorName,
      averageValue,
      startTime,
      endTime,
      streamId,
    }) => ({
      id,
      title,
      sensorName,
      averageValue,
      startTime,
      endTime,
      streamId,
    })
  );
};

export const getFixedSessionPointsBySessionId = (
  sessions: FixedSession[],
  sessionId: number
): Session[] => {
  const transformedSessions = transformSessionData(sessions);
  const session = transformedSessions.find(
    (session) => Number(session.id) === Number(sessionId)
  );

  return session
    ? [
        {
          id: session.id,
          lastMeasurementValue: session.lastMeasurementValue,
          point: session.point,
        },
      ]
    : [];
};

import { SessionTypes, type SessionType } from "../types/filters";
import { SensorPrefix } from "../types/sensors";

export const EXPORT_SESSION_LIST_LIMIT_STANDARD = 100;
export const EXPORT_SESSION_LIST_LIMIT_FIXED_AIR = 20;

export function getSessionListExportLimit(
  sessionType: SessionType,
  sensorName?: string,
): number {
  if (sessionType === SessionTypes.MOBILE) {
    return EXPORT_SESSION_LIST_LIMIT_STANDARD;
  }

  const name = sensorName?.toLowerCase() ?? "";
  if (name.startsWith(SensorPrefix.GOVERNMENT.toLowerCase())) {
    return EXPORT_SESSION_LIST_LIMIT_STANDARD;
  }
  if (name.startsWith(SensorPrefix.AIR.toLowerCase())) {
    return EXPORT_SESSION_LIST_LIMIT_FIXED_AIR;
  }

  return EXPORT_SESSION_LIST_LIMIT_STANDARD;
}

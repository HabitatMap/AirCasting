import { Thresholds } from "../types/thresholds";
import { StatusEnum } from "../types/api";
import { MobileStreamState } from "../store/mobileStreamSlice";
import { FixedStreamState } from "../store/fixedStreamSlice";

export const calculateUniformThresholds = (
  min: number,
  max: number
): Thresholds => {
  const step = Math.max(Math.floor((max - min) / 4), 1);

  const lowThreshold = min + step;
  const middleThreshold = lowThreshold + step;
  const highThreshold = middleThreshold + step;
  const maxThreshold = Math.max(highThreshold + step, max);

  return {
    min,
    low: lowThreshold,
    middle: middleThreshold,
    high: highThreshold,
    max: maxThreshold,
  };
};

export const calculateMinMaxValues = (
  mobileStream: MobileStreamState,
  fixedStream: FixedStreamState,
  sessionId: number | null
): { min: number; max: number } | null => {
  if (
    mobileStream.status === StatusEnum.Fulfilled &&
    mobileStream.data.id === sessionId
  ) {
    const min = Math.floor(mobileStream.minMeasurementValue!);
    const max = Math.ceil(mobileStream.maxMeasurementValue!);
    return { min, max };
  } else if (
    fixedStream.status === StatusEnum.Fulfilled &&
    fixedStream.data.stream.sessionId === sessionId
  ) {
    const min = Math.floor(fixedStream.minMeasurementValue!);
    const max = Math.ceil(fixedStream.maxMeasurementValue!);
    return { min, max };
  } else {
    console.warn("No stream data available or session mismatch");
    return null;
  }
};

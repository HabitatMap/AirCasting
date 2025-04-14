import { Thresholds } from "../types/thresholds";

import { FixedStreamState } from "../store/fixedStreamSlice";
import { MobileStreamState } from "../store/mobileStreamSlice";
import { StatusEnum } from "../types/api";

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
    if (
      mobileStream.minMeasurementValue !== undefined &&
      mobileStream.minMeasurementValue !== null &&
      mobileStream.maxMeasurementValue !== undefined &&
      mobileStream.maxMeasurementValue !== null
    ) {
      const min = Math.floor(mobileStream.minMeasurementValue);
      const max = Math.ceil(mobileStream.maxMeasurementValue);
      return { min, max };
    }
  } else if (
    fixedStream.status === StatusEnum.Fulfilled &&
    fixedStream.data.stream.sessionId === sessionId
  ) {
    if (
      fixedStream.minMeasurementValue !== undefined &&
      fixedStream.minMeasurementValue !== null &&
      fixedStream.maxMeasurementValue !== undefined &&
      fixedStream.maxMeasurementValue !== null
    ) {
      const min = Math.floor(fixedStream.minMeasurementValue);
      const max = Math.ceil(fixedStream.maxMeasurementValue);
      return { min, max };
    }
  }

  return null;
};

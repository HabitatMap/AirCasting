import { Thresholds } from "../types/thresholds";
import { calculateThumbPercentage } from "./thresholdThumbCalculations";

export const handleMouseMove = (
  thresholdKey: keyof Thresholds,
  startX: number,
  startValue: number,
  thresholdValues: Thresholds,
  sliderWidth: number,
  setThresholdValues: React.Dispatch<React.SetStateAction<Thresholds>>,
  setInputValue: React.Dispatch<React.SetStateAction<string>>
) => (moveEvent: globalThis.MouseEvent) => {
  // How much the thumb has moved horizontally since drag started.
  const displacement = moveEvent.clientX - startX;

  // Threshold new percentage, based on thumb value when dragging started,
  // the displacement, and slider width.
  const newPercentage =
    calculateThumbPercentage(
      startValue,
      thresholdValues.min,
      thresholdValues.max
    ) +
    displacement / sliderWidth;

  // Threshold new value based on the threshold new percentage.
  let newThresholdValue = Math.round(
    thresholdValues.min +
      newPercentage * (thresholdValues.max - thresholdValues.min)
  );

  // Ensure the value is within min and max bounds.
  const newThresholdValueWithinBounds = Math.min(
    Math.max(newThresholdValue, thresholdValues.min),
    thresholdValues.max
  );
  let updatedValues: Thresholds = { ...thresholdValues };
  let currentValue = newThresholdValueWithinBounds;

  currentValue = Math.max(currentValue, thresholdValues.min);
  currentValue = Math.min(currentValue, thresholdValues.max);

  setInputValue(currentValue.toString());

  switch (thresholdKey) {
    case "low":
      if (
        currentValue >= thresholdValues.middle &&
        thresholdValues.middle !== thresholdValues.max
      ) {
        updatedValues.middle = Math.min(
          currentValue + 1,
          thresholdValues.max
        );
      }
      if (
        currentValue >= thresholdValues.high &&
        thresholdValues.high !== thresholdValues.max
      ) {
        updatedValues.high = Math.min(
          currentValue + 2,
          thresholdValues.max
        );
      }
      break;
    case "middle":
      if (
        currentValue <= thresholdValues.low &&
        thresholdValues.low !== thresholdValues.min
      ) {
        updatedValues.low = Math.max(currentValue - 1, thresholdValues.min);
      }
      if (
        currentValue > thresholdValues.high &&
        thresholdValues.high !== thresholdValues.max
      ) {
        updatedValues.high = Math.min(
          currentValue + 1,
          thresholdValues.max
        );
      }
      break;
    case "high":
      if (
        currentValue <= thresholdValues.middle &&
        thresholdValues.middle !== thresholdValues.min
      ) {
        updatedValues.middle = Math.max(
          currentValue - 1,
          thresholdValues.min
        );
      }
      if (
        currentValue <= thresholdValues.low &&
        thresholdValues.low !== thresholdValues.min
      ) {
        updatedValues.low = Math.max(currentValue - 2, thresholdValues.min);
      }
      break;
  }

  updatedValues[thresholdKey] = currentValue;

  setThresholdValues(updatedValues);
};

export const handleMouseUp = (
  moveHandler: (moveEvent: globalThis.MouseEvent | TouchEvent) => void
) => () => {
  document.removeEventListener("mousemove", moveHandler);
  document.removeEventListener("touchmove", moveHandler);
  document.removeEventListener(
    "mouseup",
    handleMouseUp(moveHandler) as EventListener
  );
  document.removeEventListener(
    "touchend",
    handleMouseUp(moveHandler) as EventListener
  );
};

export const handleTouchMove = (
  thresholdKey: keyof Thresholds,
  startX: number,
  startValue: number,
  thresholdValues: Thresholds,
  sliderWidth: number,
  setThresholdValues: React.Dispatch<React.SetStateAction<Thresholds>>,
  setInputValue: React.Dispatch<React.SetStateAction<string>>
) => (moveEvent: TouchEvent) => {
  moveEvent.preventDefault();

  const touch = moveEvent.touches[0];

  handleMouseMove(
    thresholdKey,
    startX,
    startValue,
    thresholdValues,
    sliderWidth,
    setThresholdValues,
    setInputValue
  )({
    clientX: touch.clientX,
  } as globalThis.MouseEvent);
};

export const handleMouseDown = (
  thresholdKey: keyof Thresholds,
  thresholdValues: Thresholds,
  sliderWidth: number,
  setThresholdValues: React.Dispatch<React.SetStateAction<Thresholds>>,
  setInputValue: React.Dispatch<React.SetStateAction<string>>,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>
) => (event: React.MouseEvent<HTMLInputElement>) => {

  setErrorMessage("");

  const startX = event.clientX;
  const startValue = thresholdValues[thresholdKey];
  const moveHandler = handleMouseMove(
    thresholdKey,
    startX,
    startValue,
    thresholdValues,
   sliderWidth,
    setThresholdValues,
    setInputValue
  );

  document.addEventListener("mousemove", moveHandler as EventListener);
  document.addEventListener(
    "mouseup",
    handleMouseUp(moveHandler as (moveEvent: TouchEvent | MouseEvent) => void) as EventListener
  );
};

export const handleTouchStart = (
  thresholdKey: keyof Thresholds,
  thresholdValues: Thresholds,
  sliderWidth: number,
  setThresholdValues: React.Dispatch<React.SetStateAction<Thresholds>>,
  setInputValue: React.Dispatch<React.SetStateAction<string>>,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>
) => (event: React.TouchEvent<HTMLInputElement>) => {

  setErrorMessage("");

  const startX = event.touches[0].clientX;
  const startValue = thresholdValues[thresholdKey];
  const moveHandler = handleTouchMove(
    thresholdKey,
    startX,
    startValue,
    thresholdValues,
  sliderWidth,
    setThresholdValues,
    setInputValue
  );

  setInputValue(startValue.toString());
  document.addEventListener("touchmove", moveHandler);
  document.addEventListener(
    "touchend",
    handleMouseUp(moveHandler as (moveEvent: TouchEvent | MouseEvent) => void) as EventListener
  );
};

import React, { useEffect, useRef, useState } from "react";

import { Thresholds } from "../../types/thresholds";
import {
  calculateThumbPercentage,
  calculateThumbPosition,
} from "../../utils/thresholdThumbCalculations";
import * as S from "./ThresholdConfigurator.style";

interface ThresholdsConfiguratorProps {
  initialThresholds: Thresholds;
}

interface ThumbPositions extends Omit<Thresholds, "min" | "max"> {}

const ThresholdsConfigurator: React.FC<ThresholdsConfiguratorProps> = ({
  initialThresholds,
}) => {
  const [thresholdValues, setThresholdValues] = useState(initialThresholds);
  const [thumbPositions, setThumbPositions] = useState<ThumbPositions>(
    {} as ThumbPositions
  );
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sliderRef.current) {
      setSliderWidth(sliderRef.current.offsetWidth);
    }
    const { min, low, middle, high, max } = thresholdValues;
    const lowThumb = calculateThumbPosition(low, min, max, sliderWidth);
    const middleThumb = calculateThumbPosition(middle, min, max, sliderWidth);
    const highThumb = calculateThumbPosition(high, min, max, sliderWidth);

    setThumbPositions({ low: lowThumb, middle: middleThumb, high: highThumb });
  }, [thresholdValues, sliderWidth]);

  const handleInputChange = (thresholdKey: keyof Thresholds, value: string) => {
    setThresholdValues({ ...thresholdValues, [thresholdKey]: Number(value) });
  };

  const handleMouseMove =
    (thresholdKey: keyof Thresholds, startX: number, startValue: number) =>
    (moveEvent: globalThis.MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const newPercentage =
        calculateThumbPercentage(
          startValue,
          thresholdValues.min,
          thresholdValues.max
        ) +
        dx / sliderWidth;
      const newValue = Math.round(
        thresholdValues.min +
          newPercentage * (thresholdValues.max - thresholdValues.min)
      );

      setThresholdValues((prevThresholds) => {
        return {
          ...prevThresholds,
          [thresholdKey]: Math.min(
            Math.max(newValue, thresholdValues.min),
            thresholdValues.max
          ),
        };
      });
    };

  const handleMouseUp =
    (moveHandler: (moveEvent: globalThis.MouseEvent) => void) => () => {
      document.removeEventListener("mousemove", moveHandler as EventListener);
      document.removeEventListener(
        "mouseup",
        handleMouseUp(moveHandler) as EventListener
      );
    };

  const handleMouseDown =
    (thresholdKey: keyof Thresholds) =>
    (event: React.MouseEvent<HTMLInputElement>) => {
      const startX = event.clientX;
      const startValue = thresholdValues[thresholdKey];
      const moveHandler = handleMouseMove(thresholdKey, startX, startValue);

      document.addEventListener("mousemove", moveHandler as EventListener);
      document.addEventListener(
        "mouseup",
        handleMouseUp(moveHandler) as EventListener
      );
    };

  const { min, max, ...thumbs } = thresholdValues;
  const thumbData = Object.entries(thumbs) as [keyof Thresholds, number][];

  return (
    <S.Container ref={sliderRef}>
      <S.NumberInput
        type="number"
        value={min}
        onChange={(e) => handleInputChange("min", e.target.value)}
      />
      {thumbData.map(([thresholdKey, value]) => (
        <React.Fragment key={thresholdKey}>
          <S.RangeInput
            min={min}
            max={max}
            $firstThumbPos={thumbPositions.low}
            $secondThumbPos={thumbPositions.middle}
            $thirdThumbPos={thumbPositions.high}
            $sliderWidth={sliderWidth}
            type="range"
            value={value}
            onChange={(e) => handleInputChange(thresholdKey, e.target.value)}
          />
          <S.NumberInput
            inputMode="numeric"
            type="number"
            value={value}
            style={{
              left: `${calculateThumbPosition(value, min, max, sliderWidth)}px`,
            }}
            // TODO debounce
            onChange={(e) => handleInputChange(thresholdKey, e.target.value)}
            onMouseDown={handleMouseDown(thresholdKey)}
            //TODO Add touch event handlers if supporting touch devices
          />
        </React.Fragment>
      ))}
      <S.NumberInput
        inputMode="numeric"
        type="number"
        step={1}
        value={max}
        style={{
          right: "-30px",
        }}
        // TODO debounce
        onChange={(e) => handleInputChange("max", e.target.value)}
        //TODO onBlur={() => setInputValue(value.toString())}
      />
    </S.Container>
  );
};

export { ThresholdsConfigurator };

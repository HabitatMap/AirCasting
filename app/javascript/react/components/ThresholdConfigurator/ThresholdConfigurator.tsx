import React, { useEffect, useRef, useState } from "react";

import { Thresholds } from "../../types/thresholds";
import * as S from "./ThresholdConfigurator.style";

const calculateThumbPercentage = (
  value: number,
  min: number,
  max: number
): number => {
  const percentage = (value - min) / (max - min);
  return percentage;
};

const calculateThumbPosition = (
  value: number,
  min: number,
  max: number,
  width: number
): number => {
  const percentage = calculateThumbPercentage(value, min, max);
  return percentage * width;
};

interface ThresholdsConfiguratorProps {
  initialThresholds: Thresholds;
}

interface ThumbPositions extends Omit<Thresholds, "min" | "max"> {}

const ThresholdsConfigurator: React.FC<ThresholdsConfiguratorProps> = ({
  initialThresholds,
}) => {
  const [thresholds, setThresholds] = useState(initialThresholds);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [thumbPositions, setThumbPositions] = useState<ThumbPositions>(
    {} as ThumbPositions
  );
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sliderRef.current) {
      setSliderWidth(sliderRef.current.offsetWidth);
    }
    const { min, low, middle, high, max } = thresholds;
    const lowThumb = calculateThumbPosition(low, min, max, sliderWidth);
    const middleThumb = calculateThumbPosition(middle, min, max, sliderWidth);
    const highThumb = calculateThumbPosition(high, min, max, sliderWidth);

    setThumbPositions({ low: lowThumb, middle: middleThumb, high: highThumb });
  }, [thresholds, sliderWidth]);

  const handleInputChange = (thresholdKey: keyof Thresholds, value: string) => {
    setThresholds({ ...thresholds, [thresholdKey]: Number(value) });
  };

  const handleMouseMove =
    (thresholdKey: keyof Thresholds, startX: number, startValue: number) =>
    (moveEvent: globalThis.MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const newPercentage =
        calculateThumbPercentage(startValue, thresholds.min, thresholds.max) +
        dx / sliderWidth;
      const newValue = Math.round(
        thresholds.min + newPercentage * (thresholds.max - thresholds.min)
      );

      setThresholds((prevThresholds) => {
        return {
          ...prevThresholds,
          [thresholdKey]: Math.min(
            Math.max(newValue, thresholds.min),
            thresholds.max
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
      const startValue = thresholds[thresholdKey];
      const moveHandler = handleMouseMove(thresholdKey, startX, startValue);

      document.addEventListener("mousemove", moveHandler as EventListener);
      document.addEventListener(
        "mouseup",
        handleMouseUp(moveHandler) as EventListener
      );
    };

  const { min, max, ...thumbs } = thresholds;
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
            $min={min}
            $max={max}
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

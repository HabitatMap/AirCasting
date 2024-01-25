import React, { useEffect, useRef, useState } from "react";

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
  initialThresholds: number[];
}

const ThresholdsConfigurator: React.FC<ThresholdsConfiguratorProps> = ({
  initialThresholds,
}) => {
  const [thresholds, setThresholds] = useState(initialThresholds);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [thumbPositions, setThumbPositions] = useState<number[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sliderRef.current) {
      setSliderWidth(sliderRef.current.offsetWidth);
    }
    const [min, low, middle, high, max] = thresholds;
    const lowThumb = calculateThumbPosition(low, min, max, sliderWidth);
    const middleThumb = calculateThumbPosition(middle, min, max, sliderWidth);
    const highThumb = calculateThumbPosition(high, min, max, sliderWidth);

    setThumbPositions([lowThumb, middleThumb, highThumb]);
  }, [thresholds, sliderWidth]);

  const handleInputChange = (index: number, value: string) => {
    const numericValue = Number(value);
    const newValues = [...thresholds];
    newValues[index] = numericValue;
    setThresholds(newValues);
  };

  const handleMouseMove =
    (index: number, startX: number, startValue: number) =>
    (moveEvent: globalThis.MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const newPercentage =
        calculateThumbPercentage(startValue, thresholds[0], thresholds[4]) +
        dx / sliderWidth;
      const newValue = Math.round(
        thresholds[0] + newPercentage * (thresholds[4] - thresholds[0])
      );

      setThresholds((prevThresholds) => {
        const newThresholds = [...prevThresholds];
        newThresholds[index + 1] = Math.min(
          Math.max(newValue, thresholds[0]),
          thresholds[4]
        );
        return newThresholds;
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
    (index: number) => (event: React.MouseEvent<HTMLInputElement>) => {
      const startX = event.clientX;
      const startValue = thresholds[index + 1];
      const moveHandler = handleMouseMove(index, startX, startValue);

      document.addEventListener("mousemove", moveHandler as EventListener);
      document.addEventListener(
        "mouseup",
        handleMouseUp(moveHandler) as EventListener
      );
    };

  return (
    <S.Container ref={sliderRef}>
      <S.NumberInput
        type="number"
        value={thresholds[0]}
        onChange={(e) => handleInputChange(0, e.target.value)}
      />
      {thresholds.slice(1, -1).map((value, index) => (
        <React.Fragment key={index}>
          <S.RangeInput
            $min={thresholds[0]}
            $max={thresholds[4]}
            $firstThumbPos={thumbPositions[0]}
            $secondThumbPos={thumbPositions[1]}
            $thirdThumbPos={thumbPositions[2]}
            $sliderWidth={sliderWidth}
            type="range"
            value={value}
            onChange={(e) => handleInputChange(index + 1, e.target.value)}
          />
          <S.NumberInput
            inputMode="numeric"
            type="number"
            value={value}
            style={{
              left: `${calculateThumbPosition(
                value,
                thresholds[0],
                thresholds[4],
                sliderWidth
              )}px`,
            }}
            // TODO debounce
            onChange={(e) => handleInputChange(index + 1, e.target.value)}
            onMouseDown={handleMouseDown(index)}
            //TODO Add touch event handlers if supporting touch devices
          />
        </React.Fragment>
      ))}
      <S.NumberInput
        inputMode="numeric"
        type="number"
        step={1}
        value={thresholds[4]}
        style={{
          right: "-30px",
        }}
        // TODO debounce
        onChange={(e) => handleInputChange(4, e.target.value)}
        //TODO onBlur={() => setInputValue(value.toString())}
      />
    </S.Container>
  );
};

export { ThresholdsConfigurator };

import React, { MouseEvent, useEffect, useRef, useState } from "react";

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

type ThresholdsConfiguratorProps = {
  initialThresholds: number[];
};

const ThresholdsConfigurator: React.FC<ThresholdsConfiguratorProps> = ({
  initialThresholds,
}) => {
  const [thresholds, setThresholds] = useState(initialThresholds);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [thumbPositions, setThumbPositions] = useState<number[]>([]);

  useEffect(() => {
    if (sliderRef.current) {
      setSliderWidth(sliderRef.current.offsetWidth);
    }

    const first = calculateThumbPosition(
      thresholds[1],
      thresholds[0],
      thresholds[4],
      sliderWidth
    );

    const second = calculateThumbPosition(
      thresholds[2],
      thresholds[0],
      thresholds[4],
      sliderWidth
    );

    const third = calculateThumbPosition(
      thresholds[3],
      thresholds[0],
      thresholds[4],
      sliderWidth
    );

    setThumbPositions([first, second, third]);
  }, [thresholds, sliderWidth]);

  const handleInputChange = (index: number, value: string) => {
    const newValues = [...thresholds];
    newValues[index] = Number(value);
    setThresholds(newValues);
  };

  const handleMouseDown =
    (index: number) => (event: MouseEvent<HTMLInputElement>) => {
      const startX = event.clientX;
      const startValue = thresholds[index + 1];

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;

        const newPercentage =
          calculateThumbPercentage(startValue, thresholds[0], thresholds[4]) +
          dx / sliderWidth;

        const newValue = Math.round(
          thresholds[0] + newPercentage * (thresholds[4] - thresholds[0])
        );

        // Update value within bounds
        setThresholds((prevThresholds) => {
          const newThresholds = [...prevThresholds];
          newThresholds[index + 1] = Math.min(
            Math.max(newValue, thresholds[0]),
            thresholds[4]
          );
          return newThresholds;
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove as any);
        document.removeEventListener("mouseup", handleMouseUp as any);
      };

      document.addEventListener("mousemove", handleMouseMove as any);
      document.addEventListener("mouseup", handleMouseUp as any);
    };

  return (
    <S.Container ref={sliderRef}>
      <S.NumberInput
        type="number"
        style={{
          left: "0px",
        }}
        value={thresholds[0]}
        onChange={(e) => handleInputChange(0, e.target.value)}
      />
      {thresholds.slice(1, -1).map((value, index) => (
        <React.Fragment key={index}>
          <S.RangeInput
            thresholds={thresholds}
            $firstThumbPos={thumbPositions[0]}
            $secondThumbPos={thumbPositions[1]}
            $thirdThumbPos={thumbPositions[2]}
            $sliderWidth={sliderWidth}
            type="range"
            value={value}
            onChange={(e) => handleInputChange(index + 1, e.target.value)}
          />
          <S.NumberInput
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
            onChange={(e) => handleInputChange(index + 1, e.target.value)}
            onMouseDown={handleMouseDown(index)}
            // Add touch event handlers if supporting touch devices
          />
        </React.Fragment>
      ))}
      <S.NumberInput
        step={1}
        type="number"
        value={thresholds[4]}
        style={{
          right: "-30px",
        }}
        onChange={(e) => handleInputChange(4, e.target.value)}
        // onBlur={() => setInputValue(value.toString())}
      />
    </S.Container>
  );
};

export { ThresholdsConfigurator };

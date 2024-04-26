import React, { useEffect, useRef, useState } from "react";

import { Thresholds } from "../../types/thresholds";
import {
  calculateThumbPercentage,
  calculateThumbPosition,
} from "../../utils/thresholdThumbCalculations";
import * as S from "./ThresholdConfigurator.style";
import { Heading } from "../../pages/CalendarPage/CalendarPage.style";
import { useTranslation } from "react-i18next";

import { screenSizes } from "../../utils/media";
import HeaderToggle from "../molecules/Calendar/HeaderToggle/HeaderToggle";

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
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < screenSizes.mobile
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < screenSizes.mobile);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
      // How much the thumb has moved horizntally since drag started.
      const displacement = moveEvent.clientX - startX;

      // Threshold new percentage, based on thumb value when dragging started,
      // the displacement and slider width.
      const newPercentage =
        calculateThumbPercentage(
          startValue,
          thresholdValues.min,
          thresholdValues.max
        ) +
        displacement / sliderWidth;

      // Threshold new value based on the threshold new percentage.
      const newThresholdValue = Math.round(
        thresholdValues.min +
          newPercentage * (thresholdValues.max - thresholdValues.min)
      );

      // Ensure the value is within min and max bounds.
      const newThresholdValueWithinBounds = Math.min(
        Math.max(newThresholdValue, thresholdValues.min),
        thresholdValues.max
      );

      setThresholdValues((prevThresholds) => {
        return {
          ...prevThresholds,
          [thresholdKey]: newThresholdValueWithinBounds,
        };
      });
    };

  const handleMouseUp =
    (moveHandler: (moveEvent: globalThis.MouseEvent | TouchEvent) => void) =>
    () => {
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

  const handleTouchMove =
    (thresholdKey: keyof Thresholds, startX: number, startValue: number) =>
    (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();

      const touch = moveEvent.touches[0];
      const displacement = touch.clientX - startX;

      handleMouseMove(
        thresholdKey,
        startX,
        startValue
      )({
        clientX: touch.clientX,
      } as globalThis.MouseEvent);
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
        handleMouseUp(
          moveHandler as (moveEvent: TouchEvent | MouseEvent) => void
        ) as EventListener
      );
    };

  const handleTouchStart =
    (thresholdKey: keyof Thresholds) =>
    (event: React.TouchEvent<HTMLInputElement>) => {
      const startX = event.touches[0].clientX;
      const startValue = thresholdValues[thresholdKey];
      const moveHandler = handleTouchMove(thresholdKey, startX, startValue);
      document.addEventListener("touchmove", moveHandler);
      document.addEventListener(
        "touchend",
        handleMouseUp(
          moveHandler as (moveEvent: TouchEvent | MouseEvent) => void
        ) as EventListener
      );
    };

  const { min, max, ...thumbs } = thresholdValues;
  const thumbData = Object.entries(thumbs) as [keyof Thresholds, number][];

  return (
    <S.Container>
      <HeaderToggle
        titleText={t("calendarHeader.legendTitle")}
        componentToToggle={
          <S.InputContainer ref={sliderRef}>
            <S.NumberInput
              inputMode="numeric"
              type="number"
              value={min}
              onChange={(e) => handleInputChange("min", e.target.value)}
              $isFirst
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
                  onChange={(e) =>
                    handleInputChange(thresholdKey, e.target.value)
                  }
                  onTouchStart={handleTouchStart(thresholdKey)}
                />
                <S.NumberInput
                  inputMode="numeric"
                  type="number"
                  value={value}
                  readOnly={isMobile}
                  style={{
                    left: `${calculateThumbPosition(
                      value,
                      min,
                      max,
                      sliderWidth
                    )}px`,
                  }}
                  // TODO debounce
                  onChange={(e) =>
                    handleInputChange(thresholdKey, e.target.value)
                  }
                  onTouchStart={handleTouchStart(thresholdKey)}
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
              $isLast
              // TODO debounce
              onChange={(e) => handleInputChange("max", e.target.value)}
              //TODO onBlur={() => setInputValue(value.toString())}
            />
          </S.InputContainer>
        }
      />
    </S.Container>
  );
};

export { ThresholdsConfigurator };

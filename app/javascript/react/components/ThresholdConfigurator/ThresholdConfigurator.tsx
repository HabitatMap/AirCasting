import React, { useEffect, useRef, useState } from "react";

import { Thresholds } from "../../types/thresholds";
import {
  calculateThumbPercentage,
  calculateThumbPosition,
} from "../../utils/thresholdThumbCalculations";
import * as S from "./ThresholdConfigurator.style";
import { Heading } from "../../pages/CalendarPage/CalendarPage.style";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";

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
  const [errorMessage, setErrorMessage] = useState("");
  const [activeInput, setActiveInput] = useState(null);

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

  const validateValue = (newValue: number, min: number, max: number) => {
    return newValue >= min && newValue <= max;
  };

  const updateAdjacentThresholds = (
    thresholdKey: keyof Thresholds,
    newValue: number
  ) => {
    switch (thresholdKey) {
      case "low":
        if (
          newValue >= thresholdValues.middle &&
          thresholdValues.middle !== thresholdValues.max
        ) {
          setThresholdValues((prevValues) => ({
            ...prevValues,
            middle: Math.min(newValue + 1, thresholdValues.max),
          }));
        }
        if (
          newValue >= thresholdValues.high &&
          thresholdValues.high !== thresholdValues.max
        ) {
          setThresholdValues((prevValues) => ({
            ...prevValues,
            high: Math.min(newValue + 2, thresholdValues.max),
          }));
        }
        break;
      case "middle":
        if (
          newValue <= thresholdValues.low &&
          thresholdValues.low !== thresholdValues.min
        ) {
          setThresholdValues((prevValues) => ({
            ...prevValues,
            low: Math.max(newValue - 1, thresholdValues.min),
          }));
        }
        if (
          newValue > thresholdValues.high &&
          thresholdValues.high !== thresholdValues.max
        ) {
          setThresholdValues((prevValues) => ({
            ...prevValues,
            high: Math.min(newValue + 1, thresholdValues.max),
          }));
        }
        break;
      case "high":
        if (
          newValue <= thresholdValues.middle &&
          thresholdValues.middle !== thresholdValues.min
        ) {
          setThresholdValues((prevValues) => ({
            ...prevValues,
            middle: Math.max(newValue - 1, thresholdValues.min),
          }));
        }
        if (
          newValue <= thresholdValues.low &&
          thresholdValues.low !== thresholdValues.min
        ) {
          setThresholdValues((prevValues) => ({
            ...prevValues,
            low: Math.max(newValue - 2, thresholdValues.min),
          }));
        }
        break;
      default:
        break;
    }
  };

  const handleInputChange = (thresholdKey: keyof Thresholds, value: string) => {
    const parsedValue = Number(value);

    if (thresholdKey === "min" || thresholdKey === "max") {
      if (!validateValue(parsedValue, -Infinity, Infinity)) {
        setErrorMessage(`Value must be a valid number`);
      } else {
        setErrorMessage("");
        setThresholdValues((prevValues) => ({
          ...prevValues,
          [thresholdKey]: parsedValue,
        }));
      }
    } else {
      if (
        !validateValue(parsedValue, thresholdValues.min, thresholdValues.max)
      ) {
        setErrorMessage(
          `Value must be between ${thresholdValues.min} and ${thresholdValues.max}`
        );
      } else {
        setErrorMessage("");
        setThresholdValues((prevValues) => ({
          ...prevValues,
          [thresholdKey]: parsedValue,
        }));
        updateAdjacentThresholds(thresholdKey, parsedValue);
      }
    }
  };

  const handleMouseMove =
    (thresholdKey: keyof Thresholds, startX: number, startValue: number) =>
    (moveEvent: globalThis.MouseEvent) => {
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

  const handleOutsideClick = (event: MouseEvent) => {
    if (
      sliderRef.current &&
      !sliderRef.current.contains(event.target as Node)
    ) {
      setErrorMessage("");
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const { min, max, ...thumbs } = thresholdValues;
  const thumbData = Object.entries(thumbs) as [keyof Thresholds, number][];
  console.log(thumbPositions.low, thumbPositions.middle, thumbPositions.high);

  return (
    <S.Container>
      <HeaderToggle
        titleText={t("calendarHeader.legendTitle")}
        componentToToggle={
          <>
            <S.InputContainer ref={sliderRef}>
              <S.NumberInput
                inputMode="numeric"
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
                    onChange={(e) => handleInputChange("min", e.target.value)}
                    onTouchStart={handleTouchStart(thresholdKey)}
                  />
                  <S.NumberInput
                    inputMode="numeric"
                    type="number"
                    value={value}
                    readOnly={isMobile}
                    onFocus={() => setActiveInput("min" as unknown as null)}
                    onBlur={() => setActiveInput(null)}
                    $hasError={errorMessage !== ""}
                    $isActive={activeInput === thresholdKey}
                    style={{
                      zIndex: 10,
                      marginLeft: value === min ? "0px" : "-15px",
                      left:
                        value === max
                          ? "98%"
                          : `${calculateThumbPosition(
                              value,
                              min,
                              max,
                              sliderWidth
                            )}px`,
                    }}
                    // TODO debounce
                    onChange={(e) => {
                      handleInputChange(thresholdKey, e.target.value);
                    }}
                    onTouchStart={handleTouchStart(thresholdKey)}
                    onMouseDown={handleMouseDown(thresholdKey)}
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
                onChange={(e) => {
                  handleInputChange("max", e.target.value);
                }}
                //TODO onBlur={() => setInputValue(value.toString())}
              />
            </S.InputContainer>
            {errorMessage && <S.ErrorMessage>{errorMessage}</S.ErrorMessage>}
          </>
        }
      />
    </S.Container>
  );
};

export { ThresholdsConfigurator };

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { Thresholds } from "../../types/thresholds";
import { calculateThumbPosition } from "../../utils/thresholdThumbCalculations";
import { screenSizes } from "../../utils/media";
import { useThresholdHandlers } from "../../utils/thresholdEventHandlers";
import {
  handleMouseDown,
  handleTouchStart,
} from "../../utils/thresholdGestureHandlers";
import { selectThreshold, updateAll } from "../../store/thresholdSlice";
import { useAppDispatch } from "../../store/hooks";
import * as S from "./ThresholdConfigurator.style";

import HeaderToggle from "../molecules/Calendar/HeaderToggle/HeaderToggle";

interface ThumbPositions extends Omit<Thresholds, "min" | "max"> {}

const maxThresholdDifference = 1;

const ThresholdsConfigurator = () => {
  const thresholdsState = useSelector(selectThreshold);
  const [thresholdValues, setThresholdValues] = useState(thresholdsState);
  const [thumbPositions, setThumbPositions] = useState<ThumbPositions>(
    {} as ThumbPositions
  );
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState("");
  const [activeInput, setActiveInput] = useState<keyof Thresholds | null>(null);
  const [inputValue, setInputValue] = useState("");
  const dispatch = useAppDispatch();

  useEffect(() => {
    const updateThresholdValues = () => {
      dispatch(updateAll(thresholdValues));
    };
    updateThresholdValues();
  }, [thresholdValues]);

  // useEffect(() => {
  //   if (sliderRef.current) {
  //     setSliderWidth(sliderRef.current.offsetWidth);
  //   }
  //   const { min, low, middle, high, max } = thresholdValues;
  //   const lowThumb = calculateThumbPosition(low, min, max, sliderWidth);
  //   const middleThumb = calculateThumbPosition(middle, min, max, sliderWidth);
  //   const highThumb = calculateThumbPosition(high, min, max, sliderWidth);

  //   setThumbPositions({ low: lowThumb, middle: middleThumb, high: highThumb });
  // }, [thresholdValues, sliderWidth]);

  useEffect(() => {
    const updateSliderWidth = () => {
      if (sliderRef.current) {
        setSliderWidth(sliderRef.current.offsetWidth);
      }
    };

    updateSliderWidth();

    const handleResize = () => {
      updateSliderWidth();
      updateThumbPositions();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    updateThumbPositions();
  }, [thresholdValues, sliderWidth]);

  const updateThumbPositions = () => {
    if (sliderRef.current) {
      const { min, low, middle, high, max } = thresholdValues;
      const lowThumb = calculateThumbPosition(low, min, max, sliderWidth);
      const middleThumb = calculateThumbPosition(middle, min, max, sliderWidth);
      const highThumb = calculateThumbPosition(high, min, max, sliderWidth);

      setThumbPositions({
        low: lowThumb,
        middle: middleThumb,
        high: highThumb,
      });
    }
  };

  const {
    handleInputChange,
    handleInputBlur,
    handleInputFocus,
    handleInputKeyDown,
    handleOutsideClick,
    resetThresholds,
  } = useThresholdHandlers(
    setThresholdValues,
    setInputValue,
    setActiveInput,
    setErrorMessage,
    thresholdValues,
    sliderRef,
    activeInput,
    inputValue
  );

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const { min, max, ...thumbs } = thresholdValues;
  const thumbData = Object.entries(thumbs) as [keyof Thresholds, number][];

  return (
    <S.Container>
      <HeaderToggle
        titleText={
          <>
            {t("calendarHeader.legendTitle")}
            <S.Units>{t("calendarHeader.measurementsUnits")}</S.Units>
          </>
        }
        resetThresholds={resetThresholds}
        componentToToggle={
          <>
            <S.InputContainer ref={sliderRef}>
              <S.NumberInput
                inputMode="numeric"
                type="number"
                value={activeInput === "min" ? inputValue : min.toString()}
                onFocus={() => handleInputFocus("min")}
                onBlur={() => handleInputBlur("min", inputValue)}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown("min")}
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
                  />
                  <S.NumberInput
                    inputMode="numeric"
                    type="number"
                    value={
                      activeInput === thresholdKey
                        ? inputValue
                        : value.toString()
                    }
                    onFocus={() => handleInputFocus(thresholdKey)}
                    onBlur={() => handleInputBlur(thresholdKey, inputValue)}
                    $hasError={errorMessage !== ""}
                    $isActive={activeInput === thresholdKey}
                    style={{
                      zIndex: 10,
                      marginLeft:
                        value === min || value === max - maxThresholdDifference
                          ? "0px"
                          : "-15px",
                      left:
                        value === max || value === max - maxThresholdDifference
                          ? "auto"
                          : `${calculateThumbPosition(
                              value,
                              min,
                              max,
                              sliderWidth
                            )}px`,
                      right:
                        value === max || value === max - maxThresholdDifference
                          ? "0px"
                          : "auto",
                    }}
                    onChange={(e) => setInputValue(e.target.value)}
                    onTouchStart={handleTouchStart(
                      thresholdKey,
                      thresholdValues,
                      sliderWidth,
                      setThresholdValues,
                      setInputValue,
                      setErrorMessage
                    )}
                    onMouseDown={handleMouseDown(
                      thresholdKey,
                      thresholdValues,
                      sliderWidth,
                      setThresholdValues,
                      setInputValue,
                      setErrorMessage
                    )}
                    onKeyDown={handleInputKeyDown(thresholdKey)}
                  />
                </React.Fragment>
              ))}
              <S.NumberInput
                inputMode="numeric"
                type="number"
                step={1}
                $isLast
                value={activeInput === "max" ? inputValue : max.toString()}
                onFocus={() => handleInputFocus("max")}
                onBlur={() => handleInputBlur("max", inputValue)}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown("max")}
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

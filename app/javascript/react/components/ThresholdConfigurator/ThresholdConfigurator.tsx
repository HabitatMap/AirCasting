import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { useAppDispatch } from "../../store/hooks";
import { selectThresholds, setUserThresholdValues } from "../../store/thresholdSlice";
import { Thresholds } from "../../types/thresholds";
import { useThresholdHandlers } from "../../utils/thresholdEventHandlers";
import { handleMouseDown, handleTouchStart } from "../../utils/thresholdGestureHandlers";
import { calculateThumbPosition } from "../../utils/thresholdThumbCalculations";
import HeaderToggle from "../molecules/Calendar/HeaderToggle/HeaderToggle";
import * as S from "./ThresholdConfigurator.style";

interface ThumbPositions extends Omit<Thresholds, "min" | "max"> {}
interface ThresholdsConfiguratorProps {
  isMapPage: boolean;
}

const maxThresholdDifference = 1;

const ThresholdsConfigurator: React.FC<ThresholdsConfiguratorProps> = ({
  isMapPage,
}) => {
  const thresholdsState = useSelector(selectThresholds);
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
    if (!_.isEqual(thresholdsState, thresholdValues)) {
      dispatch(setUserThresholdValues(thresholdValues));
    }
  }, [thresholdValues]);

  useEffect(() => {
    if (!_.isEqual(thresholdsState, thresholdValues)) {
      setThresholdValues(thresholdsState);
    }
  }, [thresholdsState]);

  useEffect(() => {
    const updateSliderWidth = () => {
      if (sliderRef.current) {
        setSliderWidth(sliderRef.current.offsetWidth);
      }
    };

    updateSliderWidth();

    const handleResize = () => {
      setTimeout(updateSliderWidth, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    updateThumbPositions();
  }, [thresholdValues, sliderWidth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrorMessage("");
    }, 4000);
    return () => clearTimeout(timer);
  });

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
    <S.Container $isMapPage={isMapPage}>
      {errorMessage && <S.ErrorMessage>{errorMessage}</S.ErrorMessage>}
      <HeaderToggle
        titleText={
          isMapPage ? (
            ""
          ) : (
            <S.StyledContainer>
              {t("calendarHeader.legendTitle")}
              <S.Units>{t("calendarHeader.measurementsUnits")}</S.Units>
            </S.StyledContainer>
          )
        }
        resetThresholds={resetThresholds}
        isMapPage={isMapPage}
        componentToToggle={
          <>
            <S.InputContainer ref={sliderRef}>
              <S.NumberInput
                inputMode="numeric"
                type="number"
                step={1}
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
                    onBlur={(e) => handleInputBlur(thresholdKey, inputValue)}
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
                    onTouchStart={(event: React.TouchEvent<HTMLInputElement>) =>
                      handleTouchStart(
                        thresholdKey,
                        thresholdValues,
                        sliderWidth,
                        setThresholdValues,
                        setInputValue,
                        setErrorMessage
                      )({ touches: [{ clientX: event.touches[0].clientX }] })
                    }
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
          </>
        }
      />
    </S.Container>
  );
};

export { ThresholdsConfigurator };

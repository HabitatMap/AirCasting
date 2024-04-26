import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";

import { Thresholds } from "../../types/thresholds";
import { calculateThumbPosition } from "../../utils/thresholdThumbCalculations";
import { screenSizes } from "../../utils/media";
import { useThresholdHandlers } from "../../utils/thresholdEventHandlers";
import {
  handleMouseDown,
  handleTouchStart,
} from "../../utils/thresholdGestureHandlers";
import * as S from "./ThresholdConfigurator.style";
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
  const [activeInput, setActiveInput] = useState<keyof Thresholds | null>(null);
  const [inputValue, setInputValue] = useState("");

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

  const {
    handleInputChange,
    handleInputBlur,
    handleInputFocus,
    handleInputKeyDown,
    handleOutsideClick,
    debouncedHandleInputChange,
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

  const resetThresholds = () => {
    debouncedHandleInputChange.cancel();
    setInputValue("");
    setThresholdValues(initialThresholds);
  };

  const { min, max, ...thumbs } = thresholdValues;
  const thumbData = Object.entries(thumbs) as [keyof Thresholds, number][];

  return (
    <S.Container>
      <HeaderToggle
        titleText={t("calendarHeader.legendTitle")}
        resetThresholds={resetThresholds}
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
                    onChange={(e) =>
                      handleInputChange(thresholdKey, e.target.value)
                    }
                    onTouchStart={handleTouchStart(
                      thresholdKey,
                      thresholdValues,
                      sliderWidth,
                      setThresholdValues,
                      setInputValue,
                      setErrorMessage
                    )}
                  />
                  <S.NumberInput
                    inputMode="numeric"
                    type="number"
                    value={
                      activeInput === thresholdKey
                        ? inputValue
                        : value.toString()
                    }
                    readOnly={isMobile}
                    onFocus={() => handleInputFocus(thresholdKey)}
                    onBlur={() => handleInputBlur(thresholdKey, inputValue)}
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
                value={max}
                $isLast
                onChange={(e) => {
                  handleInputChange("max", e.target.value);
                }}
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

import _ from "lodash";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import returnArrow from "../../assets/icons/returnArrow.svg";
import { useAppDispatch } from "../../store/hooks";
import {
  selectSliderWidth,
  selectThresholds,
  selectThumbPositions,
  setUserThresholdValues,
  updateSliderWidth,
  updateThumbPositions,
} from "../../store/thresholdSlice";
import { Thresholds } from "../../types/thresholds";
import { useThresholdHandlers } from "../../utils/thresholdEventHandlers";
import {
  handleMouseDown,
  handleTouchStart,
} from "../../utils/thresholdGestureHandlers";
import { calculateThumbPosition } from "../../utils/thresholdThumbCalculations";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import * as S from "./ThresholdConfigurator.style";
import * as colors from "../../assets/styles/colors";

interface ThresholdsConfiguratorProps {
  showResetButton?: boolean;
  showResetButtonWithText?: boolean;
  resetButtonText?: string;
  swapIconTextPosition?: boolean;
  isMobileOldStyle?: boolean;
  styles?: any;
  noDisclaimers?: boolean;
  useColorBoxStyle?: boolean;
}

const maxThresholdDifference = 1;

const ThresholdsConfigurator: React.FC<ThresholdsConfiguratorProps> = ({
  showResetButton = false,
  showResetButtonWithText = false,
  resetButtonText,
  swapIconTextPosition = false,
  isMobileOldStyle = false,
  styles = S,
  noDisclaimers = false,
  useColorBoxStyle = false,
}) => {
  const thresholdsState = useSelector(selectThresholds);
  const sliderWidth = useSelector(selectSliderWidth);
  const thumbPositions = useSelector(selectThumbPositions);
  const [errorMessage, setErrorMessage] = useState("");
  const [thresholdValues, setThresholdValues] = useState(thresholdsState);

  const sliderRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();
  const [activeInput, setActiveInput] = useState<keyof Thresholds | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const isMobile = useMobileDetection();
  const dispatch = useAppDispatch();

  const debouncedSetUserThresholdValues = useMemo(
    () =>
      _.debounce(
        (values: Thresholds) => dispatch(setUserThresholdValues(values)),
        300
      ),
    [dispatch]
  );

  useEffect(() => {
    if (!_.isEqual(thresholdsState, thresholdValues)) {
      setThresholdValues(thresholdsState);
    }
  }, [thresholdsState]);

  useEffect(() => {
    if (!_.isEqual(thresholdsState, thresholdValues)) {
      debouncedSetUserThresholdValues(thresholdValues);
    }
  }, [thresholdValues, debouncedSetUserThresholdValues]);

  const updateSliderWidthHandler = useCallback(() => {
    if (sliderRef.current) {
      const computedStyle = getComputedStyle(sliderRef.current);
      const width =
        sliderRef.current.clientWidth -
        parseFloat(computedStyle.paddingLeft) -
        parseFloat(computedStyle.paddingRight);
      dispatch(updateSliderWidth(width));
      console.log("Slider width updated", width);
    }
  }, [dispatch]);

  useLayoutEffect(() => {
    updateSliderWidthHandler();

    const handleResize = () => {
      setTimeout(updateSliderWidthHandler, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateSliderWidthHandler]);

  const updateThumbPositionsHandler = useCallback(() => {
    if (sliderRef.current) {
      const { min, low, middle, high, max } = thresholdValues;
      const lowThumb = calculateThumbPosition(
        low,
        min,
        max,
        sliderWidth,
        isMobile
      );
      const middleThumb = calculateThumbPosition(
        middle,
        min,
        max,
        sliderWidth,
        isMobile
      );
      const highThumb = calculateThumbPosition(
        high,
        min,
        max,
        sliderWidth,
        isMobile
      );

      const thumbPositions = {
        low: lowThumb,
        middle: middleThumb,
        high: highThumb,
      };
      dispatch(updateThumbPositions(thumbPositions));
    }
  }, [thresholdValues, sliderWidth, dispatch]);

  useLayoutEffect(() => {
    updateThumbPositionsHandler();
  }, [thresholdValues, sliderWidth, updateThumbPositionsHandler]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrorMessage("");
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const {
    handleInputBlur,
    handleInputFocus,
    handleInputKeyDown,
    handleOutsideClick,
    resetThresholds,
    handleSliderClick,
  } = useThresholdHandlers(
    setThresholdValues,
    setInputValue,
    setActiveInput,
    setErrorMessage,
    thresholdValues,
    sliderRef,
    activeInput,
    inputValue,
    sliderWidth
  );

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [handleOutsideClick]);

  const { min, max, ...thumbs } = thresholdValues;
  const thumbData = Object.entries(thumbs) as [keyof Thresholds, number][];

  const resetButtonDefaultText = t("thresholdConfigurator.resetButton");
  const finalResetButtonText = resetButtonText || resetButtonDefaultText;

  const displayResetButton = () => {
    if (!showResetButton && !showResetButtonWithText) return null;
    return showResetButtonWithText ? (
      <S.ResetButton onClick={resetThresholds}>
        {swapIconTextPosition ? (
          <>
            {finalResetButtonText}
            <img
              src={returnArrow}
              alt={t("thresholdConfigurator.altResetButton")}
            />
          </>
        ) : (
          <>
            <img
              src={returnArrow}
              alt={t("thresholdConfigurator.altResetButton")}
            />
            {finalResetButtonText}
          </>
        )}
      </S.ResetButton>
    ) : (
      <S.ThresholdResetButton onClick={resetThresholds}>
        <img
          src={returnArrow}
          alt={t("thresholdConfigurator.altResetButton")}
        />
      </S.ThresholdResetButton>
    );
  };

  const oldStyleSliderHandles = () => {
    return (
      <>
        {thumbData.map(([thresholdKey, value]) => (
          <React.Fragment key={thresholdKey}>
            <S.OldStyleSliderHandles
              style={{
                left: `${calculateThumbPosition(
                  value,
                  min,
                  max,
                  sliderWidth,
                  isMobile
                )}px`,
              }}
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
            >
              <S.OldStyleSliderHandle />
              <S.OldStyleSliderText>{value}</S.OldStyleSliderText>
            </S.OldStyleSliderHandles>
          </React.Fragment>
        ))}
      </>
    );
  };

  const renderDefaultSlider = () => (
    <>
      {!isMobileOldStyle && (
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
      )}
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
            readOnly
            $isMobileOldStyle={isMobileOldStyle}
          />
          {!isMobileOldStyle && (
            <S.NumberInput
              inputMode="numeric"
              type="number"
              value={
                activeInput === thresholdKey ? inputValue : value.toString()
              }
              onFocus={() => handleInputFocus(thresholdKey)}
              onBlur={() => handleInputBlur(thresholdKey, inputValue)}
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
                        sliderWidth,
                        isMobile
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
          )}
        </React.Fragment>
      ))}
      {!isMobileOldStyle && (
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
      )}
      {isMobileOldStyle && oldStyleSliderHandles()}
    </>
  );

  const renderSlider = () => (
    <S.SliderContainer $isMobileOldStyle={isMobileOldStyle}>
      {errorMessage && <S.ErrorMessage>{errorMessage}</S.ErrorMessage>}
      <S.InputContainer
        ref={sliderRef}
        onClick={(event) =>
          !useColorBoxStyle &&
          handleSliderClick(event as React.MouseEvent<HTMLDivElement>)
        }
        onTouchStart={(event) =>
          !useColorBoxStyle &&
          handleSliderClick(event as React.TouchEvent<HTMLDivElement>)
        }
        $isMobileOldStyle={isMobileOldStyle}
        $useColorBoxStyle={useColorBoxStyle}
      >
        {useColorBoxStyle ? renderColorBoxSlider() : renderDefaultSlider()}
      </S.InputContainer>
    </S.SliderContainer>
  );

  const renderColorBoxSlider = () => (
    <S.StaticMobileSliderContainer>
      <S.ColorBoxNumberInput
        inputMode="numeric"
        type="number"
        step={1}
        value={activeInput === "min" ? inputValue : min.toString()}
        onFocus={() => handleInputFocus("min")}
        onBlur={() => handleInputBlur("min", inputValue)}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleInputKeyDown("min")}
      />

      <S.ColorBox style={{ background: colors.green }} />

      <S.ColorBoxNumberInput
        inputMode="numeric"
        type="number"
        step={1}
        value={activeInput === "low" ? inputValue : thumbs.low.toString()}
        onFocus={() => handleInputFocus("low")}
        onBlur={() => handleInputBlur("low", inputValue)}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleInputKeyDown("low")}
      />

      <S.ColorBox style={{ background: colors.yellow }} />

      <S.ColorBoxNumberInput
        inputMode="numeric"
        type="number"
        step={1}
        value={activeInput === "middle" ? inputValue : thumbs.middle.toString()}
        onFocus={() => handleInputFocus("middle")}
        onBlur={() => handleInputBlur("middle", inputValue)}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleInputKeyDown("middle")}
      />

      <S.ColorBox style={{ background: colors.orange }} />

      <S.ColorBoxNumberInput
        inputMode="numeric"
        type="number"
        step={1}
        value={activeInput === "high" ? inputValue : thumbs.high.toString()}
        onFocus={() => handleInputFocus("high")}
        onBlur={() => handleInputBlur("high", inputValue)}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleInputKeyDown("high")}
      />

      <S.ColorBox style={{ background: colors.red }} />

      <S.ColorBoxNumberInput
        inputMode="numeric"
        type="number"
        step={5}
        value={activeInput === "max" ? inputValue : max.toString()}
        onFocus={() => handleInputFocus("max")}
        onBlur={() => handleInputBlur("max", inputValue)}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleInputKeyDown("max")}
      />
    </S.StaticMobileSliderContainer>
  );

  return isMobile || noDisclaimers ? (
    <>
      {renderSlider()}
      {displayResetButton()}
    </>
  ) : (
    <>
      <S.DesktopContainer>
        <S.ThresholdsDisclaimer>
          {t("thresholdConfigurator.disclaimer")}
        </S.ThresholdsDisclaimer>
        {renderSlider()}
        <S.Units>{t("calendarHeader.measurementsUnits")}</S.Units>
      </S.DesktopContainer>
      {displayResetButton()}
    </>
  );
};

export { ThresholdsConfigurator };

import _ from "lodash";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as colors from "../../assets/styles/colors";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectSliderWidth,
  selectThresholds,
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

interface ThresholdSliderProps {
  isMobileOldStyle: boolean;
  useColorBoxStyle: boolean;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
}

const maxThresholdDifference = 1;

const ThresholdSlider: React.FC<ThresholdSliderProps> = ({
  isMobileOldStyle,
  useColorBoxStyle,
  setErrorMessage,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const thresholdsState = useAppSelector(selectThresholds);
  const sliderWidth = useAppSelector(selectSliderWidth);
  const [thresholdValues, setThresholdValues] = useState(thresholdsState);
  const [activeInput, setActiveInput] = useState<keyof Thresholds | null>(null);
  const [inputValue, setInputValue] = useState<string>("");

  const thumbPositions = useAppSelector(
    (state) => state.threshold.thumbPositions
  );
  const isMobile = useMobileDetection();
  const dispatch = useAppDispatch();

  const colorsMap = {
    min: colors.green,
    low: colors.yellow,
    middle: colors.orange,
    high: colors.red,
    max: colors.red,
  };

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrorMessage("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [setErrorMessage]);

  const {
    handleInputBlur,
    handleInputFocus,
    handleInputKeyDown,
    handleOutsideClick,
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

      const newThumbPositions = {
        low: lowThumb,
        middle: middleThumb,
        high: highThumb,
      };
      dispatch(updateThumbPositions(newThumbPositions));
    }
  }, [thresholdValues, sliderWidth, isMobile, dispatch]);

  useLayoutEffect(() => {
    updateThumbPositionsHandler();
  }, [thresholdValues, sliderWidth, updateThumbPositionsHandler]);

  const { min, max, ...thumbs } = thresholdValues;
  const thumbData = Object.entries(thumbs) as [keyof Thresholds, number][];

  const renderNumberInput = (
    thresholdKey: keyof Thresholds,
    value: number,
    positionStyle: React.CSSProperties = {}
  ) => (
    <S.NumberInput
      inputMode="numeric"
      type="number"
      value={activeInput === thresholdKey ? inputValue : value.toString()}
      onFocus={() => handleInputFocus(thresholdKey)}
      onBlur={() => handleInputBlur(thresholdKey, inputValue)}
      style={{
        ...positionStyle,
        zIndex: 10,
        marginLeft:
          thresholdKey === "min" ? "-15px" : value === max ? "0px" : "-15px",
        left:
          thresholdKey === "max"
            ? "auto"
            : `${calculateThumbPosition(
                value,
                min,
                max,
                sliderWidth,
                isMobile
              )}px`,
        right: thresholdKey === "max" ? "-20px" : "auto",
      }}
      onChange={(e) => setInputValue(e.target.value)}
      onTouchStart={
        thresholdKey === "min" || thresholdKey === "max"
          ? undefined
          : (event: React.TouchEvent<HTMLInputElement>) =>
              handleTouchStart(
                thresholdKey,
                thresholdValues,
                sliderWidth,
                setThresholdValues,
                setInputValue,
                setErrorMessage
              )({ touches: [{ clientX: event.touches[0].clientX }] })
      }
      onMouseDown={
        thresholdKey === "min" || thresholdKey === "max"
          ? undefined
          : handleMouseDown(
              thresholdKey,
              thresholdValues,
              sliderWidth,
              setThresholdValues,
              setInputValue,
              setErrorMessage
            )
      }
      onKeyDown={
        thresholdKey === "min" || thresholdKey === "max"
          ? undefined
          : handleInputKeyDown(thresholdKey)
      }
      $isLast={thresholdKey === "max"}
      $isMin={thresholdKey === "min"}
    />
  );

  const renderDefaultSlider = () => (
    <>
      {!isMobileOldStyle && renderNumberInput("min", min)}
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
          {!isMobileOldStyle &&
            renderNumberInput(thresholdKey, value, {
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
            })}
        </React.Fragment>
      ))}
      {!isMobileOldStyle && renderNumberInput("max", max)}
      {isMobileOldStyle &&
        thumbData.map(([thresholdKey, value]) => (
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
              onTouchStart={
                thresholdKey === "min" || thresholdKey === "max"
                  ? undefined
                  : (event: React.TouchEvent<HTMLInputElement>) =>
                      handleTouchStart(
                        thresholdKey,
                        thresholdValues,
                        sliderWidth,
                        setThresholdValues,
                        setInputValue,
                        setErrorMessage
                      )({ touches: [{ clientX: event.touches[0].clientX }] })
              }
              onMouseDown={
                thresholdKey === "min" || thresholdKey === "max"
                  ? undefined
                  : handleMouseDown(
                      thresholdKey,
                      thresholdValues,
                      sliderWidth,
                      setThresholdValues,
                      setInputValue,
                      setErrorMessage
                    )
              }
              onKeyDown={handleInputKeyDown(thresholdKey)}
            >
              <S.OldStyleSliderHandle />
              <S.OldStyleSliderText>{value}</S.OldStyleSliderText>
            </S.OldStyleSliderHandles>
          </React.Fragment>
        ))}
    </>
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

      <S.ColorBox style={{ background: colorsMap["min"] }} />

      {thumbData.map(([thresholdKey, value]) => (
        <React.Fragment key={thresholdKey}>
          <S.ColorBoxNumberInput
            inputMode="numeric"
            type="number"
            step={1}
            value={activeInput === thresholdKey ? inputValue : value.toString()}
            onFocus={() => handleInputFocus(thresholdKey)}
            onBlur={() => handleInputBlur(thresholdKey, inputValue)}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown(thresholdKey)}
          />
          <S.ColorBox style={{ background: colorsMap[thresholdKey] }} />
        </React.Fragment>
      ))}
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

  return (
    <S.InputContainer
      ref={sliderRef}
      onClick={(event) => !useColorBoxStyle && handleSliderClick(event)}
      onTouchStart={(event) => !useColorBoxStyle && handleSliderClick(event)}
      $isMobileOldStyle={isMobileOldStyle}
      $useColorBoxStyle={useColorBoxStyle}
    >
      {useColorBoxStyle ? renderColorBoxSlider() : renderDefaultSlider()}
    </S.InputContainer>
  );
};

export default ThresholdSlider;

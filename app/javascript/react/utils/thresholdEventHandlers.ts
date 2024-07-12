import { debounce } from "lodash";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectDefaultThresholds } from "../store/thresholdSlice";
import { KeyboardKeys } from "../types/keyboardKeys";
import { Thresholds } from "../types/thresholds";

export const useThresholdHandlers = (
  setThresholdValues: React.Dispatch<React.SetStateAction<Thresholds>>,
  setInputValue: React.Dispatch<React.SetStateAction<string>>,
  setActiveInput: React.Dispatch<React.SetStateAction<keyof Thresholds | null>>,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
  thresholdValues: Thresholds,
  sliderRef: React.RefObject<HTMLDivElement>,
  activeInput: keyof Thresholds | null,
  inputValue: string,
  sliderWidth: number
) => {
  const inputDebounceTime = 300;
  const { t } = useTranslation();
  const defaultThresholds = useSelector(selectDefaultThresholds);

  const isValueValid = (
    newValue: number,
    min: number,
    max: number
  ): boolean => {
    return newValue >= min && newValue <= max;
  };

  useEffect(() => {
    if (activeInput !== null) {
      setInputValue(thresholdValues[activeInput].toString());
    }
  }, [activeInput, thresholdValues, setInputValue]);

  const clearErrorAndUpdateThreshold = (
    thresholdKey: string,
    parsedValue: number
  ) => {
    setErrorMessage("");
    setThresholdValues((prevValues) => ({
      ...prevValues,
      [thresholdKey]: parsedValue,
    }));
  };

  const validateThresholdOrder = (
    key: keyof Thresholds,
    value: number
  ): boolean => {
    const { min, low, middle, high, max } = thresholdValues;

    switch (key) {
      case "low":
        return value < middle;
      case "middle":
        return value > low && value < high;
      case "high":
        return value > middle;
      default:
        return true;
    }
  };

  const handleInputChange = (thresholdKey: keyof Thresholds, value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue === "") {
      setInputValue("");
      setErrorMessage(t("thresholdConfigurator.emptyInputMessage"));
      return;
    }
    setInputValue(trimmedValue);

    const parsedValue = Number(trimmedValue);

    if (thresholdKey === "min" || thresholdKey === "max") {
      if (!isValueValid(parsedValue, -Infinity, Infinity)) {
        setErrorMessage(
          t("thresholdConfigurator.validValueMessage", {
            minValue: thresholdValues.min,
            maxValue: thresholdValues.max,
          })
        );
      } else {
        if (thresholdKey === "min" && parsedValue >= thresholdValues.max) {
          setErrorMessage(
            t("thresholdConfigurator.minGreaterThanMaxMessage", {
              maxValue: thresholdValues.max,
            })
          );
        } else if (
          thresholdKey === "max" &&
          parsedValue <= thresholdValues.min
        ) {
          setErrorMessage(
            t("thresholdConfigurator.maxLessThanMinMessage", {
              minValue: thresholdValues.min,
            })
          );
        } else {
          clearErrorAndUpdateThreshold(thresholdKey, parsedValue);
        }
      }
    } else {
      if (
        !isValueValid(parsedValue, thresholdValues.min, thresholdValues.max)
      ) {
        setErrorMessage(
          t("thresholdConfigurator.validValueMessage", {
            minValue: thresholdValues.min,
            maxValue: thresholdValues.max,
          })
        );
      } else if (!validateThresholdOrder(thresholdKey, parsedValue)) {
        setErrorMessage(t("thresholdConfigurator.invalidOrderMessage"));
      } else {
        clearErrorAndUpdateThreshold(thresholdKey, parsedValue);
      }
    }
  };

  const debouncedHandleInputChange = debounce(
    handleInputChange,
    inputDebounceTime
  );

  const handleInputBlur = (
    thresholdKey: keyof Thresholds,
    inputValue: string
  ) => {
    debouncedHandleInputChange.flush();
    setActiveInput(null);
    handleInputChange(thresholdKey, inputValue);
  };

  const handleInputFocus = (thresholdKey: keyof Thresholds) => {
    setInputValue(thresholdValues[thresholdKey].toString());
    setActiveInput(thresholdKey);
    debouncedHandleInputChange.cancel();
  };

  const handleOutsideClick = (event: MouseEvent) => {
    if (
      sliderRef.current &&
      !sliderRef.current.contains(event.target as Node) &&
      activeInput !== null
    ) {
      setActiveInput(null);
    }
  };

  const handleInputKeyDown =
    (thresholdKey: keyof Thresholds) =>
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === KeyboardKeys.Enter) {
        setInputValue(event.currentTarget.value);
        handleInputChange(thresholdKey, event.currentTarget.value);
      } else if (
        event.key === KeyboardKeys.ArrowUp ||
        event.key === KeyboardKeys.ArrowDown
      ) {
        event.preventDefault();
        let newValue;
        const step = event.shiftKey ? 10 : 1;
        const direction = event.key === KeyboardKeys.ArrowUp ? 1 : -1;
        newValue = parseFloat(inputValue) + step * direction;
        handleInputChange(thresholdKey, newValue.toString());
      }
    };

  const resetThresholds = () => {
    debouncedHandleInputChange.cancel();
    setThresholdValues(defaultThresholds);
    setInputValue("");
    setActiveInput(null);
  };

  const onInputChange = (thresholdKey: keyof Thresholds, value: string) => {
    setInputValue(value);
    handleInputChange(thresholdKey, value);
  };

  const handleSliderClick = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (sliderRef.current && activeInput === null) {
      const rect = sliderRef.current.getBoundingClientRect();
      const clientX =
        "touches" in event ? event.touches[0].clientX : event.clientX;
      const clickX = clientX - rect.left;
      const clickValue = Math.round(
        (clickX / sliderWidth) * (thresholdValues.max - thresholdValues.min) +
          thresholdValues.min
      );

      const distances = {
        low: Math.abs(clickValue - thresholdValues.low),
        middle: Math.abs(clickValue - thresholdValues.middle),
        high: Math.abs(clickValue - thresholdValues.high),
      };

      const closestThumb = (
        Object.keys(distances) as (keyof typeof distances)[]
      ).reduce((a, b) => (distances[a] < distances[b] ? a : b));

      if (
        (closestThumb === "high" && clickValue >= thresholdValues.max) ||
        (closestThumb === "low" && clickValue <= thresholdValues.min)
      ) {
        return;
      }

      const newThresholdValues = {
        ...thresholdValues,
        [closestThumb]: clickValue,
      };
      setThresholdValues(newThresholdValues);
    }
  };

  return {
    handleInputChange: onInputChange,
    handleInputBlur,
    handleInputFocus,
    handleInputKeyDown,
    handleOutsideClick,
    resetThresholds,
    handleSliderClick,
  };
};

// thresholdHandlers.tsx
import { useState } from "react";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";

import { updateAdjacentThresholds } from "./tresholdsUpdateAdjacent";

interface Thresholds {
  min: number;
  low: number;
  middle: number;
  high: number;
  max: number;
}

export const useThresholdHandlers = (
  setThresholdValues: React.Dispatch<React.SetStateAction<Thresholds>>,
  setInputValue: React.Dispatch<React.SetStateAction<string>>,
  setActiveInput: React.Dispatch<React.SetStateAction<keyof Thresholds | null>>,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
  thresholdValues: Thresholds,
  sliderRef: React.RefObject<HTMLDivElement>,
  activeInput: keyof Thresholds | null,
  inputValue: string
) => {
  const [inputDebounceTime] = useState(300);
  const { t } = useTranslation();

  const handleInputChange = (thresholdKey: keyof Thresholds, value: string) => {
    const trimmedValue = value.trim();
    setInputValue(trimmedValue);

    if (trimmedValue === "") {
      setErrorMessage(t("thresholdConfigurator.emptyInputMessage"));
      return;
    }

    setInputValue(trimmedValue);

    const parsedValue = Number(trimmedValue);

    if (thresholdKey === "min" || thresholdKey === "max") {
      if (!validateValue(parsedValue, -Infinity, Infinity)) {
        setErrorMessage(t("thresholdConfigurator.emptyInputMessage"));
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
          t("thresholdConfigurator.validValueMessage", {
            minValue: thresholdValues.min,
            maxValue: thresholdValues.max,
          })
        );
      } else {
        setErrorMessage("");
        setThresholdValues((prevValues) => ({
          ...prevValues,
          [thresholdKey]: parsedValue,
        }));

        updateAdjacentThresholds(
          thresholdKey,
          parsedValue,
          setThresholdValues,
          thresholdValues
        );
      }
    }
  };

  const debouncedHandleInputChange = debounce(
    handleInputChange,
    inputDebounceTime
  );

  const handleInputBlur = (thresholdKey: keyof Thresholds, value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue === "") {
      setErrorMessage(t("thresholdConfigurator.emptyInputMessage"));
      return;
    }

    debouncedHandleInputChange(thresholdKey, trimmedValue);
  };

  const handleInputFocus = (thresholdKey: keyof Thresholds) => {
    setInputValue(thresholdValues[thresholdKey].toString());
    setActiveInput(thresholdKey);
  };

  const validateValue = (newValue: number, min: number, max: number) => {
    return newValue >= min && newValue <= max;
  };

  const handleOutsideClick = (event: MouseEvent) => {
    if (
      sliderRef.current &&
      !sliderRef.current.contains(event.target as Node) &&
      activeInput !== null &&
      inputValue.trim() === ""
    ) {
      setErrorMessage(t("thresholdConfigurator.emptyInputMessage"));
    }
  };

  const handleInputKeyDown =
    (thresholdKey: keyof Thresholds) =>
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        setInputValue(event.currentTarget.value);
        handleInputChange(thresholdKey, event.currentTarget.value);
      }
    };

  return {
    handleInputChange,
    handleInputBlur,
    handleInputFocus,
    handleInputKeyDown,
    handleOutsideClick,
  };
};

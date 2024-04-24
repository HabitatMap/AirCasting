<<<<<<< HEAD
=======
// thresholdHandlers.tsx
import { useState } from "react";
>>>>>>> b1107419 (Refactor code and extract handlers into seperate file)
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";

import { updateAdjacentThresholds } from "./tresholdsUpdateAdjacent";
<<<<<<< HEAD
import { KeyboardKeys } from "../types/keyboardKeys";
import { useEffect } from "react";
=======
>>>>>>> b1107419 (Refactor code and extract handlers into seperate file)

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
<<<<<<< HEAD
  const inputDebounceTime = 300;
  const { t } = useTranslation();

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
  }, [activeInput, thresholdValues]);

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

  const handleInputChange = (thresholdKey: keyof Thresholds, value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue === "") {
      setInputValue("");
=======
  const [inputDebounceTime] = useState(300);
  const { t } = useTranslation();

  const handleInputChange = (thresholdKey: keyof Thresholds, value: string) => {
    const trimmedValue = value.trim();
    setInputValue(trimmedValue);

    if (trimmedValue === "") {
>>>>>>> b1107419 (Refactor code and extract handlers into seperate file)
      setErrorMessage(t("thresholdConfigurator.emptyInputMessage"));
      return;
    }

    setInputValue(trimmedValue);

    const parsedValue = Number(trimmedValue);

    if (thresholdKey === "min" || thresholdKey === "max") {
<<<<<<< HEAD
      if (!isValueValid(parsedValue, -Infinity, Infinity)) {
        setErrorMessage(t("thresholdConfigurator.invalidMinMaxMessage"));
      } else {
        clearErrorAndUpdateThreshold(thresholdKey, parsedValue);
      }
    } else {
      if (
        !isValueValid(parsedValue, thresholdValues.min, thresholdValues.max)
=======
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
>>>>>>> b1107419 (Refactor code and extract handlers into seperate file)
      ) {
        setErrorMessage(
          t("thresholdConfigurator.validValueMessage", {
            minValue: thresholdValues.min,
            maxValue: thresholdValues.max,
          })
        );
      } else {
<<<<<<< HEAD
        clearErrorAndUpdateThreshold(thresholdKey, parsedValue);
=======
        setErrorMessage("");
        setThresholdValues((prevValues) => ({
          ...prevValues,
          [thresholdKey]: parsedValue,
        }));
>>>>>>> b1107419 (Refactor code and extract handlers into seperate file)

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

<<<<<<< HEAD
=======
  const validateValue = (newValue: number, min: number, max: number) => {
    return newValue >= min && newValue <= max;
  };

>>>>>>> b1107419 (Refactor code and extract handlers into seperate file)
  const handleOutsideClick = (event: MouseEvent) => {
    if (
      sliderRef.current &&
      !sliderRef.current.contains(event.target as Node) &&
<<<<<<< HEAD
      activeInput !== null
=======
      activeInput !== null &&
      inputValue.trim() === ""
>>>>>>> b1107419 (Refactor code and extract handlers into seperate file)
    ) {
      setErrorMessage(t("thresholdConfigurator.emptyInputMessage"));
    }
  };

  const handleInputKeyDown =
    (thresholdKey: keyof Thresholds) =>
    (event: React.KeyboardEvent<HTMLInputElement>) => {
<<<<<<< HEAD
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
=======
      if (event.key === "Enter") {
        setInputValue(event.currentTarget.value);
        handleInputChange(thresholdKey, event.currentTarget.value);
>>>>>>> b1107419 (Refactor code and extract handlers into seperate file)
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

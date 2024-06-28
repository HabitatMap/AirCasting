import { debounce } from "lodash";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { selectFixedData } from "../store/fixedStreamSlice";
import { useAppDispatch } from "../store/hooks";
import { KeyboardKeys } from "../types/keyboardKeys";
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
  const inputDebounceTime = 300;
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const fixedStreamData = useSelector(selectFixedData);
  const initialThresholdsState = fixedStreamData.stream;

  const isValueValid = (
    newValue: number,
    min: number,
    max: number
  ): boolean => {
    return (
      newValue >= -Infinity &&
      newValue <= Infinity &&
      newValue >= min &&
      newValue <= max
    );
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
          updateAdjacentThresholds(
            thresholdKey,
            parsedValue,
            setThresholdValues,
            thresholdValues
          );
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
      } else {
        clearErrorAndUpdateThreshold(thresholdKey, parsedValue);
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

    setThresholdValues(initialThresholdsState);
    setInputValue("");
    setActiveInput(null);
  };

  const onInputChange = (thresholdKey: keyof Thresholds, value: string) => {
    setInputValue(value);
    handleInputChange(thresholdKey, value);
  };

  return {
    handleInputChange: onInputChange,
    handleInputBlur,
    handleInputFocus,
    handleInputKeyDown,
    handleOutsideClick,
    resetThresholds,
  };
};

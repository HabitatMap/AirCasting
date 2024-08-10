import { useCombobox } from "downshift";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import { selectParameters, selectSensors } from "../../store/sensorsSlice";
import { setBasicPrametersModalOpen } from "../../store/sessionFiltersSlice";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { setSensor } from "../../utils/setSensor";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import * as S from "./SessionFilters.style";

const CustomParameterFilter = () => {
  const [items, setItems] = useState<string[]>([""]);
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const parameters = useAppSelector(selectParameters);
  const { setUrlParams, sessionType, currentUserSettings } = useMapParams();
  const isMobile = useMobileDetection();
  const sensors = useAppSelector(selectSensors);
  const dispatch = useAppDispatch();

  const { t } = useTranslation();

  const getParametersFilter = (inputValue: string) => {
    const lowerCasedInputValue = inputValue.toLowerCase();

    const parametersFilter = (parameter: string) => {
      return (
        !inputValue || parameter.toLowerCase().startsWith(lowerCasedInputValue)
      );
    };

    return parametersFilter;
  };

  const { getInputProps, getMenuProps, getItemProps } = useCombobox({
    items: parameters,
    inputValue,
    selectedItem,
    onInputValueChange: ({ inputValue }) => {
      setInputValue(inputValue);
      setItems(parameters.filter(getParametersFilter(inputValue)));
    },
    onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
      setUrlParams([
        {
          key: UrlParamsTypes.previousUserSettings,
          value: currentUserSettings,
        },
        {
          key: UrlParamsTypes.currentUserSettings,
          value: isMobile ? UserSettings.FiltersView : UserSettings.MapView,
        },
        {
          key: UrlParamsTypes.measurementType,
          value: newSelectedItem,
        },
        {
          key: UrlParamsTypes.sensorName,
          value: setSensor(newSelectedItem, sessionType, sensors).sensorName,
        },
        {
          key: UrlParamsTypes.unitSymbol,
          value: setSensor(newSelectedItem, sessionType, sensors).unitSymbol,
        },
      ]);
      dispatch(setBasicPrametersModalOpen(false));

      setTimeout(() => {
        dispatch(setLoading(true));
        setSelectedItem("");
      }, 200);
    },
  });

  useEffect(() => {
    setItems(parameters);
  }, [parameters]);

  return (
    <>
      <S.Hr />
      <S.CustomParameterWrapper>
        <S.FiltersOptionHeading>
          {t("filters.customParameters")}
        </S.FiltersOptionHeading>
        <S.CustomParametersListWrapper>
          <S.CustomParametersInput {...getInputProps({ value: inputValue })} />
          <S.CustomParameterList {...getMenuProps()}>
            {items.map((item, index) => (
              <li key={index} {...getItemProps({ item, index })}>
                <S.CustomParameter>{item}</S.CustomParameter>
              </li>
            ))}
          </S.CustomParameterList>
        </S.CustomParametersListWrapper>
      </S.CustomParameterWrapper>
    </>
  );
};

export { CustomParameterFilter };

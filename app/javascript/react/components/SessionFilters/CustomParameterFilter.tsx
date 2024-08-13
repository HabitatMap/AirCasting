import { useCombobox } from "downshift";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import checkmark from "../../assets/icons/checkmarkBlue.svg";
import chevronLeft from "../../assets/icons/chevronLeft.svg";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import { selectParameters, selectSensors } from "../../store/sensorsSlice";
import {
  setBasicPrametersModalOpen,
  setCustomPrametersModalOpen,
} from "../../store/sessionFiltersSlice";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { setSensor } from "../../utils/setSensor";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import * as S from "./SessionFilters.style";

interface CustomParameterFilterProps {
  sessionsCount?: number;
}

const CustomParameterFilter: React.FC<CustomParameterFilterProps> = ({
  sessionsCount,
}) => {
  const [items, setItems] = useState<string[]>([""]);
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const parameters = useAppSelector(selectParameters);
  const { setUrlParams, sessionType, currentUserSettings, measurementType } =
    useMapParams();
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

  const onClose = () => {
    dispatch(setBasicPrametersModalOpen(true));
    dispatch(setCustomPrametersModalOpen(false));
  };

  return (
    <>
      <S.DesktopCustomParameters>
        <S.Hr />
        <S.CustomParameterWrapper>
          <S.FiltersOptionHeading>
            {t("filters.customParameters")}
          </S.FiltersOptionHeading>
          <S.CustomParametersListWrapper>
            <S.CustomParametersInput
              {...getInputProps({ value: inputValue })}
            />
            <S.CustomParameterList {...getMenuProps()}>
              {items.map((item, index) => (
                <li key={index} {...getItemProps({ item, index })}>
                  <S.CustomParameter>{item}</S.CustomParameter>
                </li>
              ))}
            </S.CustomParameterList>
          </S.CustomParametersListWrapper>
        </S.CustomParameterWrapper>
      </S.DesktopCustomParameters>

      <S.MobileCustomParameters>
        <S.ModalContent>
          <S.Header>
            <S.ChevronBackButton onClick={onClose}>
              <S.ChevronIcon $src={chevronLeft} />
            </S.ChevronBackButton>
            <S.HeaderTitle>{t("filters.selectCustomParameter")}</S.HeaderTitle>
          </S.Header>

          <S.CustomParametersListWrapper>
            <S.CustomParametersInput
              {...getInputProps({ value: inputValue })}
            />
            <S.CustomParameterList {...getMenuProps()}>
              {items.map((item, index) => (
                <S.CustomParameterItem
                  key={index}
                  {...getItemProps({ item, index })}
                >
                  <S.CustomParameter $isActive={item === measurementType}>
                    {item}
                  </S.CustomParameter>
                  {item === measurementType && <img src={checkmark} />}
                </S.CustomParameterItem>
              ))}
            </S.CustomParameterList>
          </S.CustomParametersListWrapper>
        </S.ModalContent>
        <S.ButtonsWrapper>
          <S.BackButton onClick={onClose}>{t("filters.back")}</S.BackButton>
          <S.MinorShowSessionsButton onClick={onClose}>
            {t("filters.showSessions")} ({sessionsCount})
          </S.MinorShowSessionsButton>
        </S.ButtonsWrapper>
      </S.MobileCustomParameters>
    </>
  );
};

export { CustomParameterFilter };

import { useCombobox } from "downshift";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import checkmark from "../../assets/icons/checkmarkBlue.svg";
import chevronLeft from "../../assets/icons/chevronLeft.svg";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { selectSensors } from "../../store/sensorsSlice";
import {
  setBasicParametersModalOpen,
  setCustomParametersModalOpen,
} from "../../store/sessionFiltersSlice";
import { SessionTypes } from "../../types/filters";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { setSensor } from "../../utils/setSensor";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import * as S from "./SessionFilters.style";

const getParametersFilter = (inputValue: string) => {
  const lowerCasedInputValue = inputValue.toLowerCase();
  return (parameter: string) =>
    !inputValue || parameter.toLowerCase().startsWith(lowerCasedInputValue);
};

interface CustomParameterFilterProps {
  customParameters: string[];
  sessionsCount?: number;
  onClose?: () => void;
  fetchableSessionsCount?: number;
}

const CustomParameterFilter: React.FC<CustomParameterFilterProps> = ({
  customParameters,
  sessionsCount = 0,
  onClose = () => {},
  fetchableSessionsCount,
}) => {
  const [filteredParameters, setFilteredParameters] =
    useState<string[]>(customParameters);
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");

  const {
    setUrlAndLocalStorageParams,
    sessionType,
    currentUserSettings,
    measurementType,
  } = useMapParams();
  const isMobile = useMobileDetection();
  const sensors = useAppSelector(selectSensors);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;

  const { getInputProps, getMenuProps, getItemProps } = useCombobox({
    items: filteredParameters,
    inputValue,
    selectedItem,
    onInputValueChange: ({ inputValue }) => {
      setInputValue(inputValue);
      setFilteredParameters(
        customParameters.filter(getParametersFilter(inputValue))
      );
    },
    onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
      if (newSelectedItem) {
        const sensorData = setSensor(newSelectedItem, sensors, sessionType);
        setUrlAndLocalStorageParams([
          {
            key: UrlParamsTypes.previousUserSettings,
            value: currentUserSettings,
          },
          {
            key: UrlParamsTypes.currentUserSettings,
            value: isMobile
              ? UserSettings.FiltersView
              : currentUserSettings === UserSettings.CrowdMapView
              ? UserSettings.CrowdMapView
              : UserSettings.MapView,
          },
          {
            key: UrlParamsTypes.measurementType,
            value: newSelectedItem,
          },
          {
            key: UrlParamsTypes.sensorName,
            value: sensorData.sensorName,
          },
          {
            key: UrlParamsTypes.unitSymbol,
            value: sensorData.unitSymbol,
          },
        ]);
        dispatch(setBasicParametersModalOpen(false));

        setTimeout(() => {
          dispatch(setFetchingData(true));
          setSelectedItem("");
        }, 200);
      }
    },
  });

  const goBack = () => {
    dispatch(setBasicParametersModalOpen(true));
    dispatch(setCustomParametersModalOpen(false));
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
              placeholder={t("filters.searchCustomParameters")}
            />
            <S.CustomParameterList {...getMenuProps()}>
              {filteredParameters.map((item, index) => (
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
            <S.ChevronBackButton onClick={goBack}>
              <img src={chevronLeft} />
            </S.ChevronBackButton>
            <S.HeaderTitle>{t("filters.selectCustomParameter")}</S.HeaderTitle>
          </S.Header>
          <S.CustomParametersInput
            {...getInputProps({ value: inputValue })}
            placeholder={t("filters.searchCustomParameters")}
          />
        </S.ModalContent>

        <S.CustomParametersListWrapper>
          <S.CustomParameterList {...getMenuProps()}>
            {filteredParameters.map((item, index) => (
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
        <S.ButtonsWrapper>
          <S.BackButton onClick={goBack}>{t("filters.back")}</S.BackButton>
          <S.MinorShowSessionsButton onClick={onClose}>
            {fixedSessionTypeSelected ? (
              <>
                {t("filters.showSessions")} ({sessionsCount})
              </>
            ) : (
              <>
                {t("filters.showSessions")}{" "}
                {t("map.results", {
                  results: sessionsCount,
                  fetchableSessionsCount,
                })}
              </>
            )}
          </S.MinorShowSessionsButton>
        </S.ButtonsWrapper>
      </S.MobileCustomParameters>
    </>
  );
};

export { CustomParameterFilter };

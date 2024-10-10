import { useCombobox } from "downshift";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import checkmark from "../../assets/icons/checkmarkBlue.svg";
import chevronLeft from "../../assets/icons/chevronLeft.svg";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { selectSensors } from "../../store/sensorsSlice";
import {
  setBasicSensorsModalOpen,
  setCustomSensorsModalOpen,
} from "../../store/sessionFiltersSlice";
import { SessionTypes } from "../../types/filters";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { getSensorUnitSymbol } from "./SensorFilter";
import * as S from "./SessionFilters.style";

const getSensorsFilter = (inputValue: string) => {
  const lowerCasedInputValue = inputValue.toLowerCase();
  return (sensorName: string) =>
    !inputValue || sensorName.toLowerCase().startsWith(lowerCasedInputValue);
};

interface CustomSensorFilterProps {
  customSensors: string[];
  sessionsCount?: number;
  onClose?: () => void;
  fetchableSessionsCount?: number;
}

const CustomSensorFilter: React.FC<CustomSensorFilterProps> = ({
  customSensors,
  sessionsCount = 0,
  onClose = () => {},
  fetchableSessionsCount,
}) => {
  const [filteredSensors, setFilteredSensors] =
    useState<string[]>(customSensors);
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const sensors = useAppSelector(selectSensors);
  const { setUrlParams, currentUserSettings, sensorName, sessionType } =
    useMapParams();
  const isMobile = useMobileDetection();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;

  const { getInputProps, getMenuProps, getItemProps } = useCombobox({
    items: filteredSensors,
    inputValue,
    selectedItem,
    onInputValueChange: ({ inputValue }) => {
      setInputValue(inputValue);
      setFilteredSensors(customSensors.filter(getSensorsFilter(inputValue)));
    },
    onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
      if (newSelectedItem) {
        setUrlParams([
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
            key: UrlParamsTypes.sensorName,
            value: newSelectedItem,
          },
          {
            key: UrlParamsTypes.unitSymbol,
            value: getSensorUnitSymbol(newSelectedItem, sensors),
          },
        ]);
        dispatch(setBasicSensorsModalOpen(false));

        setTimeout(() => {
          dispatch(setFetchingData(true));
          setSelectedItem("");
        }, 200);
      }
    },
  });

  const goBack = () => {
    dispatch(setBasicSensorsModalOpen(true));
    dispatch(setCustomSensorsModalOpen(false));
  };

  return (
    <>
      <S.DesktopCustomParameters>
        <S.Hr />
        <S.CustomParameterWrapper>
          <S.FiltersOptionHeading>
            {t("filters.customSensors")}
          </S.FiltersOptionHeading>
          <S.CustomParametersListWrapper>
            <S.CustomParametersInput
              {...getInputProps({ value: inputValue })}
              placeholder={t("filters.searchCustomSensors")}
            />
            <S.CustomParameterList {...getMenuProps()}>
              {filteredSensors.map((item, index) => (
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
            <S.HeaderTitle>{t("filters.selectCustomSensor")}</S.HeaderTitle>
          </S.Header>
          <S.CustomParametersInput
            {...getInputProps({ value: inputValue })}
            placeholder={t("filters.searchCustomSensors")}
          />
        </S.ModalContent>

        <S.CustomParametersListWrapper>
          <S.CustomParameterList {...getMenuProps()}>
            {filteredSensors.map((item, index) => (
              <S.CustomParameterItem
                key={index}
                {...getItemProps({ item, index })}
              >
                <S.CustomParameter $isActive={item === sensorName}>
                  {item}
                </S.CustomParameter>
                {item === sensorName && <img src={checkmark} />}
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

export { CustomSensorFilter };

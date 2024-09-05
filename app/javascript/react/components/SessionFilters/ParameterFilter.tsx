import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import checkmark from "../../assets/icons/checkmarkBlue.svg";
import chevronLeft from "../../assets/icons/chevronLeft.svg";
import chevron from "../../assets/icons/chevronRight.svg";
import minus from "../../assets/icons/minus.svg";
import plus from "../../assets/icons/plus.svg";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { selectParameters, selectSensors } from "../../store/sensorsSlice";
import {
  selectBasicParametersModalOpen,
  selectCustomParametersModalOpen,
  setBasicParametersModalOpen,
  setBasicSensorsModalOpen,
  setCustomParametersModalOpen,
} from "../../store/sessionFiltersSlice";
import {
  FixedBasicParameterTypes,
  MobileBasicParameterTypes,
  ParameterType,
  SessionType,
  SessionTypes,
} from "../../types/filters";
import { useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { CustomParameterFilter } from "./CustomParameterFilter";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const getBasicMeasurementTypes = (sessionType: SessionType) =>
  sessionType === SessionTypes.FIXED
    ? FixedBasicParameterTypes
    : MobileBasicParameterTypes;

export const filterCustomParameters = (
  parameters: string[],
  sessionType: SessionType
) => {
  const basicParameters = getBasicMeasurementTypes(sessionType);
  return parameters.filter((param) => !basicParameters.includes(param));
};

export const ParameterFilter: React.FC<{ isBasicOpen: boolean }> = ({
  isBasicOpen,
}) => {
  const { t } = useTranslation();
  const { measurementType } = useMapParams();
  const dispatch = useAppDispatch();
  const basicParametersModalOpen = useAppSelector(
    selectBasicParametersModalOpen
  );

  const handleShowParametersClick = () => {
    dispatch(setBasicParametersModalOpen(!basicParametersModalOpen));
    dispatch(setBasicSensorsModalOpen(false));
  };

  return (
    <S.SingleFilterWrapper>
      <S.SelectedOptionButton
        onClick={handleShowParametersClick}
        $isActive={isBasicOpen}
      >
        <S.SelectedOptionHeadingWrapper>
          <S.SelectedOptionHeading $isSelected={isBasicOpen}>
            {t("filters.parameter")}
          </S.SelectedOptionHeading>
          <S.SelectedOption $isSelected={isBasicOpen}>
            {measurementType}
          </S.SelectedOption>
        </S.SelectedOptionHeadingWrapper>
        <S.ChevronIcon $src={chevron} $isActive={isBasicOpen} />
      </S.SelectedOptionButton>
      <FilterInfoPopup filterTranslationLabel="filters.parameterInfo" />
    </S.SingleFilterWrapper>
  );
};

export const DesktopParameterFilter = () => {
  const [isBasicOpen, setIsBasicOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { t } = useTranslation();
  const { measurementType, sessionType, setParameterParams } = useMapParams();
  const isMobile = useMobileDetection();
  const sensors = useAppSelector(selectSensors);
  const parameters = useAppSelector(selectParameters);
  const customParameters = filterCustomParameters(parameters, sessionType);
  const basicParametersModalOpen = useAppSelector(
    selectBasicParametersModalOpen
  );
  const customParametersModalOpen = useAppSelector(
    selectCustomParametersModalOpen
  );

  const handleSelectParameter = (selectedParameter: ParameterType) => {
    setParameterParams(selectedParameter, sensors);
  };

  useEffect(() => {
    setIsBasicOpen(basicParametersModalOpen);
    setMoreOpen(customParametersModalOpen);
  }, [basicParametersModalOpen, customParametersModalOpen]);

  return (
    <S.Wrapper>
      <ParameterFilter isBasicOpen={isBasicOpen} />
      {!isMobile && isBasicOpen && (
        <S.FiltersOptionsWrapper>
          <S.BasicParameterWrapper>
            <S.FiltersOptionHeading>
              {t("filters.parameter")}
            </S.FiltersOptionHeading>
            {getBasicMeasurementTypes(sessionType).map((item, id) => (
              <S.FiltersOptionButton
                $isSelected={item === measurementType}
                key={id}
                onClick={() => handleSelectParameter(item)}
              >
                {item}
              </S.FiltersOptionButton>
            ))}
            {customParameters.length > 0 && (
              <S.SeeMoreButton onClick={() => setMoreOpen(!moreOpen)}>
                <S.SeeMoreSpan>
                  {t(`filters.${moreOpen ? "seeLess" : "seeMore"}`)}
                </S.SeeMoreSpan>
                <img src={moreOpen ? minus : plus} />
              </S.SeeMoreButton>
            )}
          </S.BasicParameterWrapper>
          {moreOpen && (
            <CustomParameterFilter customParameters={customParameters} />
          )}
        </S.FiltersOptionsWrapper>
      )}
    </S.Wrapper>
  );
};

interface MobileDeviceParameterFilterProps {
  customParameters: string[];
  sessionsCount: number | undefined;
  onClose: () => void;
  fetchableSessionsCount: number;
}

export const MobileDeviceParameterFilter: React.FC<
  MobileDeviceParameterFilterProps
> = ({ customParameters, sessionsCount, onClose, fetchableSessionsCount }) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { measurementType, sessionType, setParameterParams } = useMapParams();
  const sensors = useAppSelector(selectSensors);
  const fixedSessionTypeSelected = sessionType === SessionTypes.FIXED;

  const handleSelectParameter = useCallback(
    (selectedParameter: ParameterType) => {
      setParameterParams(selectedParameter, sensors);
    },
    [sensors]
  );

  const handleShowMoreClick = () => {
    dispatch(setBasicParametersModalOpen(false));
    dispatch(setCustomParametersModalOpen(true));
  };

  return (
    <>
      <S.ModalContent>
        <S.Header>
          <S.ChevronBackButton
            onClick={() => dispatch(setBasicParametersModalOpen(false))}
          >
            <img src={chevronLeft} />
          </S.ChevronBackButton>
          <S.HeaderTitle>{t("filters.selectParameter")}</S.HeaderTitle>
        </S.Header>
        <S.Description>{t("filters.selectParameterDescription")}</S.Description>
        <S.BasicParameterButtonsWrapper>
          {getBasicMeasurementTypes(sessionType).map((item, id) => (
            <S.BasicParameterButton
              key={id}
              onClick={() => handleSelectParameter(item)}
            >
              <S.ButtonSpan $isActive={item === measurementType}>
                {item}
              </S.ButtonSpan>
              {item === measurementType && <img src={checkmark} />}
            </S.BasicParameterButton>
          ))}
        </S.BasicParameterButtonsWrapper>
        {customParameters.length > 0 && (
          <S.GrayButton onClick={handleShowMoreClick}>
            {t("filters.showCustomParameters")}
          </S.GrayButton>
        )}
      </S.ModalContent>
      <S.ButtonsWrapper>
        <S.BackButton
          onClick={() => dispatch(setBasicParametersModalOpen(false))}
        >
          {t("filters.back")}
        </S.BackButton>
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
    </>
  );
};

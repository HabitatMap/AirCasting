import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import mobileIcon from "../../assets/icons/mobileIcon.svg";
import pinIcon from "../../assets/icons/pin.svg";
import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import {
  setBasicParametersModalOpen,
  setBasicSensorsModalOpen,
  setCustomParametersModalOpen,
  setCustomSensorsModalOpen,
} from "../../store/sessionFiltersSlice";
import { resetUserThresholds } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { useMapParams } from "../../utils/mapParamsHandler";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const SessionTypeToggle = () => {
  const dispatch = useAppDispatch();
  const { searchParams, sessionType, updateSessionType } = useMapParams();
  const { t } = useTranslation();

  const handleClick = useCallback(
    (type: SessionType) => {
      dispatch(resetUserThresholds());
      dispatch(setBasicParametersModalOpen(false));
      dispatch(setCustomParametersModalOpen(false));
      dispatch(setBasicSensorsModalOpen(false));
      dispatch(setCustomSensorsModalOpen(false));
      updateSessionType(type);
      dispatch(setFetchingData(true));
    },
    [dispatch, searchParams, updateSessionType]
  );

  return (
    <S.SingleFilterWrapper>
      <S.SessionToggleWrapper>
        <S.Tab
          $isActive={sessionType === SessionTypes.MOBILE}
          onClick={() => handleClick(SessionTypes.MOBILE)}
        >
          {t("filters.mobileSessions")}
          <S.IconWrapper
            $src={mobileIcon}
            $isActive={sessionType === SessionTypes.MOBILE}
          />
        </S.Tab>
        <S.Tab
          $isActive={sessionType === SessionTypes.FIXED}
          onClick={() => handleClick(SessionTypes.FIXED)}
        >
          {t("filters.fixedSessions")}
          <S.IconWrapper
            $src={pinIcon}
            $isActive={sessionType === SessionTypes.FIXED}
          />
        </S.Tab>
      </S.SessionToggleWrapper>
      <FilterInfoPopup filterTranslationLabel="filters.mobileFixedInfo" />
    </S.SingleFilterWrapper>
  );
};

export { SessionTypeToggle };

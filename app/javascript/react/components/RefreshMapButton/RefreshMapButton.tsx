import React from "react";
import { useTranslation } from "react-i18next";

import { cleanSessions } from "../../store/fixedSessionsSlice";
import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import * as S from "./RefreshMapButton.style";
import { clearMobileSessions } from "../../store/mobileSessionsSlice";

const RefreshMapButton = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const handleClick = () => {
    dispatch(clearMobileSessions());
    dispatch(cleanSessions());
    dispatch(setFetchingData(true));
  };

  return (
    <S.RefreshButton onClick={handleClick}>
      {t("navbar.refreshMap")}
    </S.RefreshButton>
  );
};

export { RefreshMapButton };

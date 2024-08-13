import React from "react";
import { useTranslation } from "react-i18next";

import { cleanSessions } from "../../store/fixedSessionsSlice";
import { useAppDispatch } from "../../store/hooks";
import { setFetchSessions } from "../../store/mapSlice";
import * as S from "./RefreshMapButton.style";

const RefreshMapButton = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const handleClick = () => {
    dispatch(cleanSessions());
    dispatch(setFetchSessions(true));
  };

  return (
    <S.RefreshButton onClick={handleClick}>
      {t("navbar.refreshMap")}
    </S.RefreshButton>
  );
};

export { RefreshMapButton };

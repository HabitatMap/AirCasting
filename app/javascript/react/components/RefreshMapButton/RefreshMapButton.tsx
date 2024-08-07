import React from "react";

import { useTranslation } from "react-i18next";
import { cleanSessions } from "../../store/fixedSessionsSlice";
import { useAppDispatch } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import * as S from "./RefreshMapButton.style";

interface RefreshMapButtonProps {
  isTimelapseView: boolean;
}

const RefreshMapButton: React.FC<RefreshMapButtonProps> = ({
  isTimelapseView,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const handleClick = () => {
    dispatch(cleanSessions());
    dispatch(setLoading(true));
  };

  return (
    <S.RefreshButton onClick={handleClick} $isTimelapseView={isTimelapseView}>
      {t("navbar.refreshMap")}
    </S.RefreshButton>
  );
};

export { RefreshMapButton };

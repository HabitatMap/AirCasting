import { useMap } from "@vis.gl/react-google-maps";
import React from "react";
import { useTranslation } from "react-i18next";

import { useNavigate } from "react-router-dom";
import { cleanSessions } from "../../store/fixedSessionsSlice";
import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { clearMobileSessions } from "../../store/mobileSessionsSlice";
import { updateMapBounds } from "../../utils/mapBoundsHandler";
import { useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./RefreshMapButton.style";

const RefreshMapButton = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const map = useMap();
  const { previousCenter, previousZoom, searchParams } = useMapParams();
  const navigate = useNavigate();

  const newSearchParams = new URLSearchParams(searchParams.toString());

  const handleClick = () => {
    dispatch(clearMobileSessions());
    dispatch(cleanSessions());
    dispatch(setFetchingData(true));

    const updatedParams = updateMapBounds(
      map,
      newSearchParams,
      previousCenter,
      previousZoom
    );
    if (updatedParams) {
      navigate(`?${updatedParams.toString()}`);
    }
  };

  return (
    <S.RefreshButton onClick={handleClick}>
      {t("navbar.refreshMap")}
    </S.RefreshButton>
  );
};

export { RefreshMapButton };

import { useMap } from "@vis.gl/react-google-maps";
import React from "react";
import { useTranslation } from "react-i18next";

import { useNavigate } from "react-router-dom";
import { cleanSessions } from "../../store/fixedSessionsSlice";
import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { clearMobileSessions } from "../../store/mobileSessionsSlice";
import * as Cookies from "../../utils/cookies";
import { updateMapBounds } from "../../utils/mapBoundsHandler";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./RefreshMapButton.style";

const RefreshMapButton = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const map = useMap();
  const { searchParams, previousCenter, previousZoom } = useMapParams();
  const navigate = useNavigate();

  const newSearchParams = new URLSearchParams(searchParams.toString());

  const handleClick = () => {
    const updatedParams = updateMapBounds(map, newSearchParams);
    if (updatedParams) {
      navigate(`?${updatedParams.toString()}`);
    }
    const currentCenter = JSON.stringify(
      map?.getCenter()?.toJSON() || previousCenter
    );
    const currentZoom = (map?.getZoom() || previousZoom).toString();
    newSearchParams.set(UrlParamsTypes.currentCenter, currentCenter);
    newSearchParams.set(UrlParamsTypes.currentZoom, currentZoom);
    Cookies.set(UrlParamsTypes.currentCenter, currentCenter);
    Cookies.set(UrlParamsTypes.currentZoom, currentZoom);
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

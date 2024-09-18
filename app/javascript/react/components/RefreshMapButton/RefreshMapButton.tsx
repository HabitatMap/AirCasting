import { useQueryClient } from "@tanstack/react-query";
import React from "react";

import { useTranslation } from "react-i18next";
import { useCleanSessions } from "../../hooks/useFixedSessions";
import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import * as S from "./RefreshMapButton.style";

const RefreshMapButton = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const cleanSessions = useCleanSessions();
  const dispatch = useAppDispatch();
  // const clearMobileSessions = useClearMobileSessions();

  const handleClick = async () => {
    // await clearMobileSessions.mutateAsync();
    dispatch(setFetchingData(true));
    // await cleanSessions.mutateAsync();
    // queryClient.invalidateQueries({ queryKey: ["map"] });
  };

  return (
    <S.RefreshButton onClick={handleClick}>
      {t("navbar.refreshMap")}
    </S.RefreshButton>
  );
};

export { RefreshMapButton };

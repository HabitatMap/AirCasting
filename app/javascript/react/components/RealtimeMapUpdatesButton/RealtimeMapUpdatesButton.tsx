import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RootState } from "../../store";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearMobileSessions } from "../../store/mobileSessionsSlice";
import { setRealtimeMapUpdates } from "../../store/realtimeMapUpdatesSlice";
import { screenSizes } from "../../utils/media";
import useScreenSizeDetection from "../../utils/useScreenSizeDetection";
import { CheckboxButton } from "../CheckboxButton/CheckboxButton";
import { Toggle } from "../Toggle/Toggle";
import * as S from "./RealtimeMapUpdatesButton.style";

const RealtimeMapUpdatesButton = () => {
  const { t } = useTranslation();
  const isMobile = useScreenSizeDetection(screenSizes.mobile);

  const dispatch = useAppDispatch();
  const realtimeMapUpdates = useAppSelector(
    (state: RootState) => state.realtimeMapUpdates.realtimeMapUpdates
  );

  useEffect(() => {
    realtimeMapUpdates && dispatch(clearMobileSessions());
  }, [realtimeMapUpdates, dispatch]);

  const handleRealtimeMapUpdatesChange = (isChecked: boolean) => {
    dispatch(setRealtimeMapUpdates(isChecked));
  };

  return (
    <S.RealtimeMapUpdatesButtonContainer>
      {isMobile ? (
        <Toggle
          labelLeft={t("navbar.realtimeMapUpdates")}
          isChecked={realtimeMapUpdates}
          onChange={handleRealtimeMapUpdatesChange}
          variant="toggle"
        />
      ) : (
        <CheckboxButton
          label={t("navbar.realtimeMapUpdates")}
          isChecked={realtimeMapUpdates}
          onChange={handleRealtimeMapUpdatesChange}
          staticColor
        />
      )}
    </S.RealtimeMapUpdatesButtonContainer>
  );
};

export { RealtimeMapUpdatesButton };

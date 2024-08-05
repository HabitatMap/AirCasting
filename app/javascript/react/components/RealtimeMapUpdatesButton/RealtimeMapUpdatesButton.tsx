import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import * as S from "./RealtimeMapUpdatesButton.style";
import { CheckboxButton } from "../CheckboxButton/CheckboxButton";
import useScreenSizeDetection from "../../utils/useScreenSizeDetection";
import { screenSizes } from "../../utils/media";
import { Toggle } from "../Toggle/Toggle";
import { setRealtimeMapUpdates } from "../../store/realtimeMapUpdatesSlice";
import { useAppDispatch } from "../../store/hooks";
import { RootState } from "../../store";

const RealtimeMapUpdatesButton = () => {
  const { t } = useTranslation();
  const isMobile = useScreenSizeDetection(screenSizes.mobile);

  const dispatch = useAppDispatch();
  const realtimeMapUpdates = useSelector(
    (state: RootState) => state.realtimeMapUpdates.realtimeMapUpdates
  );

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
        />
      )}
    </S.RealtimeMapUpdatesButtonContainer>
  );
};

export { RealtimeMapUpdatesButton };

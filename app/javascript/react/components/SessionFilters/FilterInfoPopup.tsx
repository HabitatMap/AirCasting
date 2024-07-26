import React from "react";
import { useTranslation } from "react-i18next";
import { PopupProps } from "reactjs-popup/dist/types";

import questionMark from "../../assets/icons/questionMark.svg";
import * as S from "./SessionFilters.style";

type CustomPopupProps = {
  children:
    | React.ReactNode
    | ((close: () => void, isOpen: boolean) => React.ReactNode);
};

const InfoPopup: React.FC<CustomPopupProps & Omit<PopupProps, "children">> = (
  props
) => {
  return <S.InfoPopup {...(props as PopupProps)} />;
};

interface FilterInfoPopupProps {
  filterTranslationLabel: string;
}

const FilterInfoPopup = ({ filterTranslationLabel }: FilterInfoPopupProps) => {
  const { t } = useTranslation();

  return (
    <InfoPopup
      trigger={
        <S.InfoButton>
          <S.InfoIcon src={questionMark} />
        </S.InfoButton>
      }
      position="left center"
      repositionOnResize={true}
      keepTooltipInside={true}
      arrow={false}
      on={["hover", "focus"]}
    >
      <S.Info>{t(filterTranslationLabel)}</S.Info>
    </InfoPopup>
  );
};

export { FilterInfoPopup };

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PopupProps } from "reactjs-popup/dist/types";

import clockIcon from "../../assets/icons/clockIcon.svg";
import copyLinkIcon from "../../assets/icons/copyLinkIcon.svg";
import filterIcon from "../../assets/icons/filter.svg";
import shareIcon from "../../assets/icons/shareIcon.svg";
import { ConfirmationMessage } from "../Modals/atoms/ConfirmationMessage";
import { CopyLinkModal, CopyLinkModalData } from "../Modals/CopyLinkModal";
import * as S2 from "../Modals/SessionDetailsModal/SessionDetailsModal.style";
import { MapButton } from "./MapButton";
import * as S from "./MapButtons.style";

enum ButtonTypes {
  FILTER = "filter",
  TIMELAPSE = "timelapse",
  COPY_LINK = "copyLink",
  SHARE = "share",
}

type CustomPopupProps = {
  children:
    | React.ReactNode
    | ((close: () => void, isOpen: boolean) => React.ReactNode);
};

const MapButtons = () => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [activeButton, setActiveButton] = useState<ButtonTypes | null>(null);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    updateButtonPosition();
    window.addEventListener("resize", updateButtonPosition);

    return () => {
      window.removeEventListener("resize", updateButtonPosition);
    };
  }, [buttonRef.current]);

  const handleClick = (buttonType: ButtonTypes) => {
    setActiveButton((prevState) =>
      prevState === buttonType ? null : buttonType
    );
  };

  const handleCopyError = (error: Error) => {
    console.error("Error copying link: ", error.message);
    alert(t("alert.linkShortenedFailed"));
  };

  const handleCopySubmit = (
    formData: CopyLinkModalData,
    close: { (): void; (): void }
  ) => {
    close();
    setShowConfirmation(true);
  };

  const updateButtonPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({ top: rect.top, left: rect.left });
    }
  };

  // Workaround for the typescript error
  const CopyLinkPopup: React.FC<
    CustomPopupProps & Omit<PopupProps, "children">
  > = (props) => {
    return <S2.SmallPopup {...(props as PopupProps)} />;
  };

  return (
    <S.MapButtonsWrapper>
      <MapButton
        title={t("navbar.filter")}
        image={filterIcon}
        onClick={() => handleClick(ButtonTypes.FILTER)}
        alt={t("navbar.altFilter")}
        isActive={activeButton === ButtonTypes.FILTER}
      />
      <MapButton
        title={t("navbar.timelapse")}
        image={clockIcon}
        onClick={() => handleClick(ButtonTypes.TIMELAPSE)}
        alt={t("navbar.altTimelapse")}
        isActive={activeButton === ButtonTypes.TIMELAPSE}
      />
      <div ref={buttonRef}>
        <CopyLinkPopup
          trigger={
            <MapButton
              title={t("navbar.copyLink")}
              image={copyLinkIcon}
              onClick={() => handleClick(ButtonTypes.COPY_LINK)}
              alt={t("navbar.altCopyLink")}
              isActive={activeButton === ButtonTypes.COPY_LINK}
            />
          }
          position="top center"
          nested
          closeOnDocumentClick
        >
          {(close) => (
            <>
              <CopyLinkModal
                onSubmit={(formData) => handleCopySubmit(formData, close)}
                onError={handleCopyError}
              />
            </>
          )}
        </CopyLinkPopup>
        {showConfirmation && (
          <S2.ConfirmationPopup
            open={showConfirmation}
            closeOnDocumentClick={false}
            arrow={false}
            contentStyle={{
              top: buttonPosition.top - 60,
              left: buttonPosition.left - 17,
              position: "absolute",
            }}
          >
            <ConfirmationMessage
              message={t("copyLinkModal.confirmationMessage")}
            />
          </S2.ConfirmationPopup>
        )}
      </div>
      <MapButton
        title={t("navbar.share")}
        image={shareIcon}
        onClick={() => handleClick(ButtonTypes.SHARE)}
        alt={t("navbar.altShare")}
        isActive={activeButton === ButtonTypes.SHARE}
      />
    </S.MapButtonsWrapper>
  );
};

export { MapButtons };

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import clockIcon from "../../assets/icons/clockIcon.svg";
import copyLinkIcon from "../../assets/icons/copyLinkIcon.svg";
import filterIcon from "../../assets/icons/filter.svg";
import shareIcon from "../../assets/icons/shareIcon.svg";
import { black } from "../../assets/styles/colors";
import { ConfirmationMessage } from "../Modals/atoms/ConfirmationMessage";
import { CopyLinkModal, CopyLinkModalData } from "../Modals/CopyLinkModal";
import * as PopupStyles from "../Modals/SessionDetailsModal/SessionDetailsModal.style";
import { CopyLinkPopup } from "../Modals/SessionDetailsModal/SessionInfo/ModalDesktopHeader";
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

  useEffect(() => {
    console.log("inside copy submit - showConfirmation", showConfirmation);
  }, [showConfirmation]);

  const handleClick = (buttonType: ButtonTypes) => {
    setActiveButton((prevState) =>
      prevState === buttonType ? null : buttonType
    );
    setShowConfirmation(false);
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
    setActiveButton(null);
    setShowConfirmation(true);
  };

  const updateButtonPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({ top: rect.top, left: rect.left });
    }
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
              onClick={() => {}}
              alt={t("navbar.altCopyLink")}
              isActive={activeButton === ButtonTypes.COPY_LINK}
            />
          }
          onOpen={() => handleClick(ButtonTypes.COPY_LINK)}
          position="bottom center"
          nested
          closeOnDocumentClick
          arrow={true}
          arrowStyle={{
            borderColor: `${black}`,
          }}
          contentStyle={{
            top: buttonPosition.top + 40,
            left: buttonPosition.left - 40,
          }}
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
        <PopupStyles.ConfirmationPopup
          open={showConfirmation}
          closeOnDocumentClick
          arrow={false}
          contentStyle={{
            top: buttonPosition.top + 40,
            left: buttonPosition.left + 20,
            position: "absolute",
          }}
        >
          <ConfirmationMessage
            message={t("copyLinkModal.confirmationMessage")}
          />
        </PopupStyles.ConfirmationPopup>
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

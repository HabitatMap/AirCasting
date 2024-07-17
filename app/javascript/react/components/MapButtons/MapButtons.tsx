import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import clockIcon from "../../assets/icons/clockIcon.svg";
import copyLinkIcon from "../../assets/icons/copyLinkIcon.svg";
import filterIcon from "../../assets/icons/filterIcon.svg";
import shareIcon from "../../assets/icons/shareIcon.svg";
import { CopyLinkComponent } from "../Popups/CopyLinkComponent";
import { MapButton } from "./MapButton";
import * as S from "./MapButtons.style";

enum ButtonTypes {
  FILTER = "filter",
  TIMELAPSE = "timelapse",
  COPY_LINK = "copyLink",
  SHARE = "share",
}

const MapButtons = () => {
  // const buttonRef = useRef<HTMLDivElement>(null);
  const [activeButton, setActiveButton] = useState<ButtonTypes | null>(null);
  // const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  // const [showConfirmation, setShowConfirmation] = useState(false);
  const { t } = useTranslation();

  // useEffect(() => {
  //   if (showConfirmation) {
  //     const timer = setTimeout(() => setShowConfirmation(false), 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [showConfirmation]);

  // useEffect(() => {
  //   updateButtonPosition();
  //   window.addEventListener("resize", updateButtonPosition);

  //   return () => {
  //     window.removeEventListener("resize", updateButtonPosition);
  //   };
  // }, [buttonRef.current]);

  const handleClick = (buttonType: ButtonTypes) => {
    setActiveButton((prevState) =>
      prevState === buttonType ? null : buttonType
    );
  };

  // const handleCopyError = (error: Error) => {
  //   console.error("Error copying link: ", error.message);
  //   alert(t("alert.linkShortenedFailed"));
  // };

  // const handleCopySubmit = (
  //   formData: CopyLinkModalData,
  //   close: { (): void; (): void }
  // ) => {
  //   close();
  //   setActiveButton(null);
  //   setShowConfirmation(true);
  // };

  // const updateButtonPosition = () => {
  //   if (buttonRef.current) {
  //     const rect = buttonRef.current.getBoundingClientRect();
  //     setButtonPosition({ top: rect.top, left: rect.left });
  //   }
  // };

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
      {/* <div ref={buttonRef}>
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
          onOpen={() => {
            handleClick(ButtonTypes.COPY_LINK);
            setShowConfirmation(false);
          }}
          onClose={() => {
            setActiveButton(null);
          }}
          position="bottom center"
          closeOnDocumentClick
          arrow={false}
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
      </div> */}
      <CopyLinkComponent
        button={
          <MapButton
            title={t("navbar.copyLink")}
            image={copyLinkIcon}
            onClick={() => {}}
            alt={t("navbar.altCopyLink")}
            isActive={activeButton === ButtonTypes.COPY_LINK}
          />
        }
        isIconOnly={false}
        showBelowButton
        onOpen={() => {
          handleClick(ButtonTypes.COPY_LINK);
        }}
        onClose={() => {
          setActiveButton(null);
        }}
      />
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

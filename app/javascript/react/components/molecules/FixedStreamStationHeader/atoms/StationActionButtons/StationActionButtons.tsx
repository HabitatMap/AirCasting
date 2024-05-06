import React from "react";
import { useTranslation } from "react-i18next";

import bellAlert from "../../../../../assets/icons/bellAlert.svg";
import copyLink from "../../../../../assets/icons/copyLink.svg";
import downloadImage from "../../../../../assets/icons/download.svg";
import shareLink from "../../../../../assets/icons/shareLink.svg";
import { Button } from "../../../../Button/Button";
import { ActionButton } from "../../../../ActionButton/ActionButton";
import * as S from "./StationActionButtons.style";

const StationActionButtons = () => {
  const { t } = useTranslation();

  const copyCurrentURL = () => {
    const currentURL = window.location.href;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(currentURL)
        .then(() => {
          alert("URL copied!");
        })
        .catch((error) => {
          console.error("Failed to copy URL: ", error);
        });
    } else {
      // Fallback for browsers that do not support Clipboard API
      const tempInput = document.createElement("input");
      tempInput.style.position = "absolute";
      tempInput.style.left = "-1000px";
      tempInput.value = currentURL;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      alert("URL copied!");
      tempInput.onerror = (e) => {
        console.log(e.toString);
      };
    }
  };

  return (
    <>
      <S.MobileButtons>
        <ActionButton
          onClick={() => {}}
          aria-label={t("calendarHeader.altShareLink")}
        >
          <img src={shareLink} />
        </ActionButton>
      </S.MobileButtons>
      <S.DesktopButtons>
        <Button
          onClick={copyCurrentURL}
          aria-label={t("calendarHeader.altShareLink")}
        >
          {t("calendarHeader.copyLink")}{" "}
          <img src={copyLink} alt={t("Copy link")} />
        </Button>
      </S.DesktopButtons>
    </>
  );
};

export { StationActionButtons };

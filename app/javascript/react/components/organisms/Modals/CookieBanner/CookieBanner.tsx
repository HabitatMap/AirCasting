import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BlueButton } from "../Modals.style";
import * as S from "./CookieBanner.style";

interface CookieBannerProps {
  onOpenCookieSettings?: () => void;
}

const CookieBanner: React.FC<CookieBannerProps> = ({
  onOpenCookieSettings,
}) => {
  const [visible, setVisible] = useState(true);
  const { t } = useTranslation();

  // Check if banner was previously dismissed
  useEffect(() => {
    const bannerDismissed = localStorage.getItem("cookieBannerDismissed");
    if (bannerDismissed === "true") {
      setVisible(false);
    }
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("cookieBannerDismissed", "true");
  };

  const handleSettingsClick = () => {
    handleDismiss();
    if (onOpenCookieSettings) {
      onOpenCookieSettings();
    }
  };

  return (
    <S.BannerWrapper>
      <S.BannerTitle>{t("cookieBanner.title")}</S.BannerTitle>
      <S.BannerDescription>{t("cookieBanner.description")}</S.BannerDescription>
      <S.BannerActions>
        <BlueButton onClick={handleDismiss}>
          {t("cookieBanner.allowAll")}
        </BlueButton>
        <S.DenyButton onClick={handleDismiss}>
          {t("cookieBanner.denyAll")}
        </S.DenyButton>
        <S.SettingsButton onClick={handleSettingsClick}>
          {t("cookieBanner.settings")}
        </S.SettingsButton>
      </S.BannerActions>
    </S.BannerWrapper>
  );
};

export { CookieBanner };

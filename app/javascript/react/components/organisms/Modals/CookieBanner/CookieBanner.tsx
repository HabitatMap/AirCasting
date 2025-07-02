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
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  // Check if cookie preferences have been set
  useEffect(() => {
    const cookiePreferences = localStorage.getItem("cookiePreferences");
    if (!cookiePreferences) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    // Set default preferences (only necessary cookies) when user dismisses without making a choice
    const defaultPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    localStorage.setItem(
      "cookiePreferences",
      JSON.stringify(defaultPreferences)
    );
  };

  const handleSettingsClick = () => {
    setVisible(false);
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

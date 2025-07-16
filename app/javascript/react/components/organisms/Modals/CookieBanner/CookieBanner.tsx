import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CookieManager } from "../../../../utils/cookieManager";
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

  useEffect(() => {
    if (!CookieManager.hasPreferences()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAllowAll = () => {
    setVisible(false);
    CookieManager.enableAll();
  };

  const handleDenyAll = () => {
    setVisible(false);
    CookieManager.disableNonNecessary();
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
        <BlueButton onClick={handleAllowAll}>
          {t("cookieBanner.allowAll")}
        </BlueButton>
        <S.DenyButton onClick={handleDenyAll}>
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

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CookieManager } from "../../../../utils/cookieManager";
import { BlueButton } from "../Modals.style";
import * as S from "./CookieBanner.style";

interface CookieBannerProps {
  onOpenCookieSettings?: () => void;
  cookieSettingsModalOpen?: boolean;
}

const CookieBanner: React.FC<CookieBannerProps> = ({
  onOpenCookieSettings,
  cookieSettingsModalOpen,
}) => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  // Only shown where prior consent is required (EEA/UK/CH). Elsewhere consent is
  // implied/opt-out and no banner is needed. When uncertain (server flag missing
  // or geo unresolved) we default to non-EU/opt-out, so only show the banner
  // when the flag is explicitly true.
  const consentRequired = window.CONSENT_REQUIRED === true;

  useEffect(() => {
    if (consentRequired && !CookieManager.hasPreferences()) {
      setVisible(true);
    }
  }, [consentRequired]);

  useEffect(() => {
    if (
      consentRequired &&
      cookieSettingsModalOpen === false &&
      !CookieManager.hasPreferences()
    ) {
      setVisible(true);
    }
  }, [consentRequired, cookieSettingsModalOpen]);

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

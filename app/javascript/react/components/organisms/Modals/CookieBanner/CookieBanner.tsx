import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { BlueButton } from "../Modals.style";
import * as S from "./CookieBanner.style";

const CookieBanner = () => {
  const [visible, setVisible] = useState(true);
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <S.BannerWrapper>
      <S.BannerTitle>{t("cookieBanner.title")}</S.BannerTitle>
      <S.BannerDescription>{t("cookieBanner.description")}</S.BannerDescription>
      <S.BannerActions>
        <BlueButton onClick={() => setVisible(false)}>
          {t("cookieBanner.allowAll")}
        </BlueButton>
        <S.DenyButton onClick={() => setVisible(false)}>
          {t("cookieBanner.denyAll")}
        </S.DenyButton>
        <S.SettingsButton onClick={() => setVisible(false)}>
          {t("cookieBanner.settings")}
        </S.SettingsButton>
      </S.BannerActions>
    </S.BannerWrapper>
  );
};

export { CookieBanner };

import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import circleCloseIcon from "../../../../assets/icons/circleCloseIcon.svg";
import { Toggle } from "../../../atoms/Toggle/Toggle";
import * as S from "./CookieSettingsModal.style";

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const CookieSettingsModal: React.FC<CookieSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always enabled
    analytics: false,
    marketing: false,
    preferences: false,
  });

  const handlePreferenceChange = (
    key: keyof CookiePreferences,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    // Here you would typically save the preferences to localStorage or send to backend
    localStorage.setItem("cookiePreferences", JSON.stringify(preferences));
    onClose();
  };

  const handleAcceptAll = () => {
    const allEnabled = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setPreferences(allEnabled);
    localStorage.setItem("cookiePreferences", JSON.stringify(allEnabled));
    onClose();
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setPreferences(onlyNecessary);
    localStorage.setItem("cookiePreferences", JSON.stringify(onlyNecessary));
    onClose();
  };

  return (
    <S.CookieSettingsModal
      open={isOpen}
      modal
      nested
      overlayStyle={{ margin: 0, zIndex: 1000 }}
      contentStyle={{ margin: 0 }}
      onClose={onClose}
      closeOnDocumentClick={false}
    >
      <S.ModalContent>
        <S.Header>
          <S.Title>{t("cookieSettings.title")}</S.Title>
          <S.CloseButton onClick={onClose}>
            <img src={circleCloseIcon} alt={t("navbar.altClose")} />
          </S.CloseButton>
        </S.Header>

        <S.Description>{t("cookieBanner.description")}</S.Description>

        <S.PreferencesContainer>
          <S.PreferenceItem>
            <S.PreferenceInfo>
              <S.PreferenceTitle>
                {t("cookieSettings.necessary.title")}
              </S.PreferenceTitle>
              <S.PreferenceDescription>
                {t("cookieSettings.necessary.description")}
              </S.PreferenceDescription>
            </S.PreferenceInfo>
            <Toggle
              isChecked={preferences.necessary}
              onChange={() => {}} // Disabled - always true
              variant="toggle"
              noLabel
            />
          </S.PreferenceItem>

          <S.PreferenceItem>
            <S.PreferenceInfo>
              <S.PreferenceTitle>
                {t("cookieSettings.analytics.title")}
              </S.PreferenceTitle>
              <S.PreferenceDescription>
                {t("cookieSettings.analytics.description")}
              </S.PreferenceDescription>
            </S.PreferenceInfo>
            <Toggle
              isChecked={preferences.analytics}
              onChange={(value) => handlePreferenceChange("analytics", value)}
              variant="toggle"
              noLabel
            />
          </S.PreferenceItem>

          <S.PreferenceItem>
            <S.PreferenceInfo>
              <S.PreferenceTitle>
                {t("cookieSettings.marketing.title")}
              </S.PreferenceTitle>
              <S.PreferenceDescription>
                {t("cookieSettings.marketing.description")}
              </S.PreferenceDescription>
            </S.PreferenceInfo>
            <Toggle
              isChecked={preferences.marketing}
              onChange={(value) => handlePreferenceChange("marketing", value)}
              variant="toggle"
              noLabel
            />
          </S.PreferenceItem>

          <S.PreferenceItem>
            <S.PreferenceInfo>
              <S.PreferenceTitle>
                {t("cookieSettings.preferences.title")}
              </S.PreferenceTitle>
              <S.PreferenceDescription>
                {t("cookieSettings.preferences.description")}
              </S.PreferenceDescription>
            </S.PreferenceInfo>
            <Toggle
              isChecked={preferences.preferences}
              onChange={(value) => handlePreferenceChange("preferences", value)}
              variant="toggle"
              noLabel
            />
          </S.PreferenceItem>
        </S.PreferencesContainer>

        <S.ActionsContainer>
          <S.RejectAllButton onClick={handleRejectAll}>
            {t("cookieSettings.rejectAll")}
          </S.RejectAllButton>
          <S.SaveButton onClick={handleSave}>
            {t("cookieSettings.save")}
          </S.SaveButton>
          <S.AcceptAllButton onClick={handleAcceptAll}>
            {t("cookieSettings.acceptAll")}
          </S.AcceptAllButton>
        </S.ActionsContainer>
      </S.ModalContent>
    </S.CookieSettingsModal>
  );
};

export { CookieSettingsModal };

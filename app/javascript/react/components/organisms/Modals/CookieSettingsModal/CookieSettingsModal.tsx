import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import circleCloseIcon from "../../../../assets/icons/circleCloseIcon.svg";
import {
  CookieManager,
  type CookiePreferences,
} from "../../../../utils/cookieManager";
import { Toggle } from "../../../atoms/Toggle/Toggle";
import * as S from "./CookieSettingsModal.style";

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookieSettingsModal: React.FC<CookieSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  // Load existing preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedPreferences = CookieManager.loadPreferences();
      setPreferences(savedPreferences);
    }
  }, [isOpen]);

  const handlePreferenceChange = (
    key: keyof CookiePreferences,
    value: boolean
  ) => {
    const newPreferences = {
      ...preferences,
      [key]: value,
    };
    setPreferences(newPreferences);

    // Apply the changes immediately
    CookieManager.updatePreference(key, value);
  };

  const handleSave = () => {
    CookieManager.savePreferences(preferences);
    onClose();
  };

  const handleAcceptAll = () => {
    CookieManager.enableAll();
    setPreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
    onClose();
  };

  const handleRejectAll = () => {
    CookieManager.disableNonNecessary();
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
    onClose();
  };

  return (
    <S.CookieSettingsModal
      open={isOpen}
      modal
      nested
      onClose={onClose}
      closeOnDocumentClick={true}
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
          <S.AcceptAllButton onClick={handleAcceptAll}>
            {t("cookieSettings.acceptAll")}
          </S.AcceptAllButton>
          <S.RejectAllButton onClick={handleRejectAll}>
            {t("cookieSettings.rejectAll")}
          </S.RejectAllButton>
          <S.SaveButton onClick={handleSave}>
            {t("cookieSettings.save")}
          </S.SaveButton>
        </S.ActionsContainer>
      </S.ModalContent>
    </S.CookieSettingsModal>
  );
};

export { CookieSettingsModal };

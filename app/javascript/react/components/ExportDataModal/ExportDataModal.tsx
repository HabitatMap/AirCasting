import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "../../store/hooks";
import { exportSession } from "../../store/exportSessionSlice";
import { DesktopExportModal } from "./DesktopExportModal";
import { EmailInput, RedErrorMessage } from "./EmailInput";
import { ConfirmationMessage } from "./ConfirmationMessage";
import downloadWhite from "../../assets/icons/downloadWhite.svg";
import { Modal } from "../Modal";
import { screenSizes } from "../../utils/media";
import { BlueButton, FormWrapper } from "./ExportModal.style";

export interface ExportModalData {
  email: string;
}

const initialExportModalData: ExportModalData = {
  email: "",
};

interface ExportDataModalProps {
  sessionId: string;
  onSubmit: (data: ExportModalData) => void;
}

const ExportDataModal: React.FC<ExportDataModalProps> = ({
  sessionId,
  onSubmit,
}) => {
  const focusInputRef = useRef<HTMLInputElement | null>(null);
  const [formState, setFormState] = useState<ExportModalData>(
    initialExportModalData
  );
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMobile = window.innerWidth <= screenSizes.mobile;
  const EMAIL_FIELD = "email";
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  // useEffect(() => {
  //   if (isOpen && focusInputRef.current) {
  //     setTimeout(() => {
  //       focusInputRef.current!.focus();
  //     }, 0);
  //   }
  //   if (!isOpen) {
  //     setFormState(initialExportModalData);
  //     setConfirmationMessage(null);
  //     setErrorMessage(null);
  //   }
  // }, [isOpen]);

  // useEffect(() => {
  //   if (confirmationMessage) {
  //     const timer = setTimeout(() => {
  //       onClose();
  //     }, 5000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [confirmationMessage, onClose]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = event.target;
    setFormState((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!validateEmail(formState.email)) {
      setErrorMessage(t("exportDataModal.invalidEmailMessage"));
      return;
    }
    dispatch(exportSession({ sessionId, email: formState.email }));
    onSubmit(formState);
    setFormState(initialExportModalData);
    setConfirmationMessage(t("exportDataModal.confirmationMessage"));
  };

  return (
    <>
      {confirmationMessage ? (
        <ConfirmationMessage message={confirmationMessage} />
      ) : (
        <form onSubmit={handleSubmit}>
          <FormWrapper>
            <EmailInput
              focusInputRef={focusInputRef}
              value={formState.email}
              onChange={handleInputChange}
            />
            <BlueButton
              type="submit"
              aria-label={t("exportDataModal.exportButton")}
            >
              {t("exportDataModal.exportButton")}{" "}
              <img src={downloadWhite} style={{ width: "1.5rem" }} />
            </BlueButton>
          </FormWrapper>

          {errorMessage && <RedErrorMessage>{errorMessage}</RedErrorMessage>}
        </form>
      )}
    </>
  );
};

export { ExportDataModal };

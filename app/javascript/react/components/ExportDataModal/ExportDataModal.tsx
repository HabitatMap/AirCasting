import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "../../store/hooks";
import { exportSession } from "../../store/exportSessionSlice";
import { ExportModal } from "./ExportModal";
import { EmailInput, RedErrorMessage } from "./EmailInput";
import { ConfirmationMessage } from "./ConfirmationMessage";
import downloadWhite from "../../assets/icons/downloadWhite.svg";

export interface ExportModalData {
  email: string;
}

const initialExportModalData: ExportModalData = {
  email: "",
};

interface ExportDataModalProps {
  sessionId: string;
  isOpen: boolean;
  position: {
    bottom: number;
    left: number;
  };
  onSubmit: (data: ExportModalData) => void;
  onClose: () => void;
}

const ExportDataModal: React.FC<ExportDataModalProps> = ({
  sessionId,
  onSubmit,
  isOpen,
  position,
  onClose,
}) => {
  const focusInputRef = useRef<HTMLInputElement | null>(null);
  const [formState, setFormState] = useState<ExportModalData>(
    initialExportModalData
  );
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const EMAIL_FIELD = "email";
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen && focusInputRef.current) {
      setTimeout(() => {
        focusInputRef.current!.focus();
      }, 0);
    }
    if (!isOpen) {
      setFormState(initialExportModalData);
      setConfirmationMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (confirmationMessage) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [confirmationMessage, onClose]);

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
    <ExportModal
      hasActionButton={!confirmationMessage}
      buttonName={t("exportDataModal.exportButton")}
      buttonHasIcon
      iconName={downloadWhite}
      handleActionButton={handleSubmit}
      isOpen={isOpen}
      position={position}
      onClose={onClose}
    >
      {confirmationMessage ? (
        <ConfirmationMessage message={confirmationMessage} />
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <EmailInput
              focusInputRef={focusInputRef}
              value={formState.email}
              onChange={handleInputChange}
            />
          </div>
          {errorMessage && <RedErrorMessage>{errorMessage}</RedErrorMessage>}
        </form>
      )}
    </ExportModal>
  );
};

export { ExportDataModal };

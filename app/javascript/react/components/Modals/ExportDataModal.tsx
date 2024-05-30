import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "../../store/hooks";
import { exportSession } from "../../store/exportSessionSlice";
import { ModalInput, RedErrorMessage } from "./ModalInput";
import { ConfirmationMessage } from "./ConfirmationMessage";
import downloadWhite from "../../assets/icons/downloadWhite.svg";
import { screenSizes } from "../../utils/media";
import { BlueButton, FormWrapper } from "./Modals.style";

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
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

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

  useEffect(() => {
    if (confirmationMessage) {
      const timer = setTimeout(() => {
        setConfirmationMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [confirmationMessage]);

  return (
    <>
      {confirmationMessage ? (
        <ConfirmationMessage message={confirmationMessage} />
      ) : (
        <form onSubmit={handleSubmit}>
          <FormWrapper>
            <ModalInput
              focusInputRef={focusInputRef}
              value={formState.email}
              onChange={handleInputChange}
              name="email"
              type="email"
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

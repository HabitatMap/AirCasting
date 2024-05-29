import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { ModalInput } from "./ModalInput";
import { ConfirmationMessage } from "./ConfirmationMessage";

import { BlueButton, FormWrapper } from "./Modals.style";

export interface CopyLinkModalData {
  link: string;
}

const initialCopyLinkModalData: CopyLinkModalData = {
  link: window.location.href, // Initialize with current URL
};

interface CopyLinkModalProps {
  sessionId: string;
  onSubmit: (data: CopyLinkModalData) => void;
}

const CopyLinkModal: React.FC<CopyLinkModalProps> = ({
  sessionId,
  onSubmit,
}) => {
  const focusInputRef = useRef<HTMLInputElement | null>(null);
  const [formState, setFormState] = useState<CopyLinkModalData>(
    initialCopyLinkModalData
  );
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    null
  );
  const { t } = useTranslation();

  // useEffect(() => {
  //   if (confirmationMessage) {
  //     const timer = setTimeout(() => {
  //       setConfirmationMessage(null);
  //     }, 4000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [confirmationMessage]);

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
    onSubmit(formState);
    setFormState(initialCopyLinkModalData);
    setConfirmationMessage(t("copyLinkModal.confirmationMessage"));
  };

  return (
    <>
      {confirmationMessage ? (
        <ConfirmationMessage message={confirmationMessage} />
      ) : (
        <form onSubmit={handleSubmit}>
          <FormWrapper>
            <ModalInput
              focusInputRef={focusInputRef}
              value={formState.link}
              onChange={handleInputChange}
              name="link"
              type="text"
            />
            <BlueButton type="submit" aria-label={t("copyLinkModal.copyLink")}>
              {t("copyLinkModal.copyLink")}
            </BlueButton>
          </FormWrapper>
        </form>
      )}
    </>
  );
};

export { CopyLinkModal };

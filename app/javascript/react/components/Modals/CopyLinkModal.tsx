import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { copyCurrentURL } from "../../utils/copyCurrentUrl";
import useShortenedLink from "../../utils/useShortenedLink";
import { ModalInput } from "./atoms/ModalInput";
import { BlueButton, FormWrapper } from "./Modals.style";

const BITLY_ACCESS_TOKEN = process.env.BITLY_ACCESS_TOKEN || "";

export interface CopyLinkModalData {
  link: string;
}

const initialCopyLinkModalData: CopyLinkModalData = {
  link: window.location.href,
};

interface CopyLinkModalProps {
  onSubmit: (data: CopyLinkModalData) => void;
}

const CopyLinkModal: React.FC<CopyLinkModalProps> = ({ onSubmit }) => {
  const focusInputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useTranslation();
  const { shortenedLink, error } = useShortenedLink(
    window.location.href,
    BITLY_ACCESS_TOKEN
  );
  const [formState, setFormState] = useState<CopyLinkModalData>(
    initialCopyLinkModalData
  );

  useEffect(() => {
    setFormState((prevFormData) => ({
      ...prevFormData,
      link: shortenedLink,
    }));
  }, [shortenedLink]);

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
    copyCurrentURL(formState.link);
    setFormState(initialCopyLinkModalData);
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
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
  );
};

export { CopyLinkModal };

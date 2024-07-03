import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ModalInput } from "./atoms/ModalInput";
import { BlueButton, FormWrapper } from "./Modals.style";

export interface CopyLinkModalData {
  link: string;
}

const initialCopyLinkModalData: CopyLinkModalData = {
  link: window.location.href,
};

interface CopyLinkModalProps {
  onSubmit: (data: CopyLinkModalData) => void;
  link: string;
}

const CopyLinkModal: React.FC<CopyLinkModalProps> = ({ onSubmit }) => {
  const focusInputRef = useRef<HTMLInputElement | null>(null);
  const [formState, setFormState] = useState<CopyLinkModalData>(
    initialCopyLinkModalData
  );
  const { t } = useTranslation();

  useEffect(() => {
    const shortenLink = async (url: string) => {
      try {
        const response = await axios.get(
          `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
        );
        setFormState((prevFormData) => ({
          ...prevFormData,
          link: response.data,
        }));
      } catch (error) {
        console.error("Error shortening the link: ", error);
      }
    };

    shortenLink(window.location.href);
  }, []);

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
    navigator.clipboard
      .writeText(formState.link)
      .then(() => {
        console.log("Link copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy the link: ", err);
      });
    setFormState(initialCopyLinkModalData);
  };

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

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PopupProps } from "reactjs-popup/dist/types";
import downloadWhite from "../../assets/icons/downloadWhite.svg";
import { white } from "../../assets/styles/colors";
import { exportSession } from "../../store/exportSessionSlice";
import { useAppDispatch } from "../../store/hooks";
import { useAutoDismissAlert } from "../../utils/useAutoDismissAlert";
import { BlueButton, FormWrapper } from "../Modals/Modals.style";
import { ModalInput, RedErrorMessage } from "../Modals/atoms/ModalInput";

import { AlertPopup } from "./AlertComponent";
import * as S from "./Popups.style";

interface ExportDataComponentProps {
  button: JSX.Element | ((isOpen: boolean) => JSX.Element) | undefined;
  sessionsIds: string[];
  isIconOnly: boolean;
  onSubmit: (data: ExportModalData) => void;
  fixedSessionTypeSelected?: boolean;
  isSessionList: boolean;
}

export interface ExportModalData {
  email: string;
}

const initialExportModalData: ExportModalData = {
  email: "",
};

type CustomPopupProps = {
  children:
    | React.ReactNode
    | ((close: () => void, isOpen: boolean) => React.ReactNode);
};

const ExportDataPopup: React.FC<
  CustomPopupProps & Omit<PopupProps, "children">
> = (props) => {
  return <S.ExportDataSmallPopup {...(props as PopupProps)} />;
};

const ExportDataComponent = ({
  button,
  fixedSessionTypeSelected,
  sessionsIds,
  onSubmit,
  isIconOnly,
  isSessionList,
}: ExportDataComponentProps) => {
  const exportButtonRef = useRef<HTMLDivElement>(null);
  const focusInputRef = useRef<HTMLInputElement | null>(null);

  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [formState, setFormState] = useState<ExportModalData>(
    initialExportModalData
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const NO_SESSIONS = sessionsIds.length === 0;

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

  const handleSubmit = (
    event: React.FormEvent,
    close: { (): void; (): void }
  ): void => {
    event.preventDefault();
    if (!validateEmail(formState.email)) {
      setErrorMessage(t("exportDataModal.invalidEmailMessage"));
      return;
    }

    if (NO_SESSIONS) {
      close();
      setErrorMessage(t("exportDataModal.noResultsMessage"));
      return;
    }

    dispatch(exportSession({ sessionsIds, email: formState.email }));
    onSubmit(formState);
    setFormState(initialExportModalData);
    setShowConfirmation(true);
    close();
  };

  const rect =
    exportButtonRef.current && exportButtonRef.current.getBoundingClientRect();

  const updateButtonPosition = () => {
    if (rect) {
      setButtonPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  useAutoDismissAlert(showConfirmation, setShowConfirmation);

  useEffect(() => {
    updateButtonPosition();
    window.addEventListener("resize", updateButtonPosition);

    return () => {
      window.removeEventListener("resize", updateButtonPosition);
    };
  }, [rect?.top]);

  const calculatePopupLeftPosition = () => {
    if (isSessionList) {
      return `${buttonPosition.left - 185}px}`;
    } else if (isIconOnly) {
      if (fixedSessionTypeSelected) {
        return `${buttonPosition.left - 60}px`;
      } else {
        return `${buttonPosition.left - 30}px`;
      }
    } else {
      return `${buttonPosition.left - 2}px}`;
    }
  };

  const dynamicArrowStyle = fixedSessionTypeSelected
    ? {}
    : {
        left: `${isIconOnly ? "32%" : "50%"}`,
        borderColor: `transparent transparent ${white} transparent`,
        borderWidth: "0 10px 10px 10px",
        borderStyle: "solid",
      };

  return (
    <S.WrapperButton ref={exportButtonRef}>
      <ExportDataPopup
        trigger={button}
        position={isSessionList ? "left center" : "top center"}
        nested
        closeOnDocumentClick
        offsetX={fixedSessionTypeSelected ? 0 : 40}
        arrowStyle={dynamicArrowStyle}
      >
        {(close) => (
          <form onSubmit={(formData) => handleSubmit(formData, close)}>
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
                {t("exportDataModal.exportButton")}
                <img src={downloadWhite} style={{ width: "1.5rem" }} />
              </BlueButton>
            </FormWrapper>

            {errorMessage && <RedErrorMessage>{errorMessage}</RedErrorMessage>}
          </form>
        )}
      </ExportDataPopup>
      {showConfirmation && (
        <AlertPopup
          open={showConfirmation}
          message={t("exportDataModal.confirmationMessage")}
          top={
            isSessionList ? buttonPosition.top - 35 : buttonPosition.top - 95
          }
          left={calculatePopupLeftPosition()}
        />
      )}
    </S.WrapperButton>
  );
};

export { ExportDataComponent };

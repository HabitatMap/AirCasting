import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PopupProps } from "reactjs-popup/dist/types";
import downloadWhite from "../../assets/icons/downloadWhite.svg";
import { white } from "../../assets/styles/colors";
import { exportSession } from "../../store/exportSessionSlice";
import { useAppDispatch } from "../../store/hooks";
import { BlueButton, FormWrapper } from "../Modals/Modals.style";
import { ConfirmationMessage } from "../Modals/atoms/ConfirmationMessage";
import { ModalInput, RedErrorMessage } from "../Modals/atoms/ModalInput";
import * as S from "./Popups.style";

interface ExportDataComponentProps {
  button: JSX.Element | ((isOpen: boolean) => JSX.Element) | undefined;
  sessionId: string;
  isIconOnly: boolean;
  onSubmit: (data: ExportModalData) => void;
  fixedSessionTypeSelected?: boolean;
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
  sessionId,
  onSubmit,
  isIconOnly,
}: ExportDataComponentProps) => {
  const exportButtonRef = useRef<HTMLDivElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const focusInputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useTranslation();

  const [formState, setFormState] = useState<ExportModalData>(
    initialExportModalData
  );
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dispatch = useAppDispatch();

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
    dispatch(exportSession({ sessionId, email: formState.email }));
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

  useEffect(() => {
    if (showConfirmation) {
      const timer = setTimeout(() => {
        setShowConfirmation(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmation]);

  useEffect(() => {
    updateButtonPosition();
    window.addEventListener("resize", updateButtonPosition);

    return () => {
      window.removeEventListener("resize", updateButtonPosition);
    };
  }, [rect?.top]);

  return (
    <S.WrapperButton ref={exportButtonRef}>
      <ExportDataPopup
        trigger={button}
        position="top center"
        nested
        closeOnDocumentClick
        offsetX={fixedSessionTypeSelected ? 0 : 40}
        arrowStyle={
          fixedSessionTypeSelected
            ? {}
            : {
                left: `${isIconOnly ? "32%" : "50%"}`,
                borderColor: `transparent transparent ${white} transparent`,
                borderWidth: "0 10px 10px 10px",
                borderStyle: "solid",
              }
        }
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
                {t("exportDataModal.exportButton")}{" "}
                <img src={downloadWhite} style={{ width: "1.5rem" }} />
              </BlueButton>
            </FormWrapper>

            {errorMessage && <RedErrorMessage>{errorMessage}</RedErrorMessage>}
          </form>
        )}
      </ExportDataPopup>
      {showConfirmation && (
        <S.ConfirmationPopup
          open={showConfirmation}
          closeOnDocumentClick={false}
          arrow={false}
          contentStyle={{
            width: "180px",
            top: `${buttonPosition.top - 95}px`,

            left: `${
              isIconOnly
                ? fixedSessionTypeSelected
                  ? buttonPosition.left - 60
                  : buttonPosition.left - 30
                : buttonPosition.left - 2
            }px`,
            position: "absolute",
          }}
        >
          <ConfirmationMessage
            message={t("exportDataModal.confirmationMessage")}
          />
        </S.ConfirmationPopup>
      )}
    </S.WrapperButton>
  );
};

export { ExportDataComponent };

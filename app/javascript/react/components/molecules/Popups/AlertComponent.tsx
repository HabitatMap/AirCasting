import React from "react";
import { ConfirmationMessage } from "../../organisms/Modals/atoms/ConfirmationMessage";
import * as S from "./Popups.style";

interface AlertPopupProps {
  open: boolean;
  message: string;
  top: number;
  left: string;
}

const AlertPopup: React.FC<AlertPopupProps> = ({
  open,
  message,
  top,
  left,
}) => {
  return (
    <S.ConfirmationPopup
      open={open}
      closeOnDocumentClick={false}
      arrow={false}
      contentStyle={{
        width: "180px",
        top: `${top}px`,
        left,
        position: "absolute",
      }}
    >
      <ConfirmationMessage message={message} />
    </S.ConfirmationPopup>
  );
};

export { AlertPopup };

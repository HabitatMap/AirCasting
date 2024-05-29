import styled from "styled-components";

import { white, blue, gray100, black } from "../../assets/styles/colors";
import { H3 } from "../Typography/Typography.style";
import { Button } from "../Button/Button.style";

interface ModalProps {
  isOpen: boolean;
  position: {
    bottom: number;
    left: number;
    top?: number;
    right?: number;
  };
  onKeyDown: React.KeyboardEventHandler<HTMLDialogElement>;
}

const ModalContainer = styled.div<ModalProps>`
  display: ${({ isOpen }) => (isOpen ? "flex" : "none")};
  justify-content: center;
  align-items: center;
  position: absolute;
  top: ${({ position }) => `${position?.top}px` ?? "auto"};
  right: ${({ position }) => `${position?.right}px` ?? "auto"};
  left: ${({ position }) => `${position?.left}px` ?? "auto"};
  bottom: ${({ position }) => `${position?.bottom}px` ?? "auto"};
  z-index: 999;
`;

const ModalContent = styled.div<{
  $minHeight: number;
  $minWidth: number;
  $borderRadius?: number;
}>`
0
  min-height: ${({ $minHeight }) => `${$minHeight}vh`};
  min-width:  ${({ $minWidth }) => `${$minWidth}vw`};
}`;

const ModalText = styled(H3)`
  font-size: 16px;
  color: ${black};
`;

const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.3125rem;
  padding-top: 0.625rem;
`;

const FlexWrapper = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 0.625rem;
`;

const BlueButton = styled(Button)`
  background-color: ${blue};
  color: ${white};
  font-weight: 100;
  border: none;
  width: fit-content;
`;

const CancelButton = styled(Button)`
  background-color: ${gray100};
  color: ${black};
  font-weight: 100;
  border: none;
`;

const CancelButtonX = styled(Button)`
  color: black;
  font-weight: 100;
  font-size: 18px;
  border: none;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 0.625rem;
  border: 1px solid ${gray100};
  border-radius: 4px;
  margin-bottom: 0.625rem;
`;

export {
  ModalContainer,
  ModalContent,
  ButtonsWrapper,
  FlexWrapper,
  BlueButton,
  CancelButton,
  CancelButtonX,
  TextInput,
  ModalText,
};

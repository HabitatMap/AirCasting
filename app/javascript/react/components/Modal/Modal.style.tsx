import styled from "styled-components";

import { white, blue, gray100, black } from "../../assets/styles/colors";
import { H3 } from "../Typography/Typography.style";
import { Button } from "../Button/Button.style";

interface ModalProps {
  isOpen: boolean;
  position: {
    bottom: number;
    left: number;
    top: number;
    right: number;
  };
  onKeyDown: React.KeyboardEventHandler<HTMLDialogElement>;
}

const ModalContainer = styled.div<ModalProps>`
  display: ${({ isOpen }) => (isOpen ? "flex" : "none")};
  justify-content: center;
  align-items: center;
  position: absolute;
  top: ${({ position }) => `${position.top}px`};
  right: ${({ position }) => `${position.right}px`};
  bottom: ${({ position }) => `${position.bottom}px`};
  left: ${({ position }) => `${position.left}px`};
  z-index: 999;
`;

const ModalContent = styled.div`
  background-color: ${white};
  opacity: 1;
  border-radius: 8px;
  position: relative;
  padding: 1.25rem;
  min-height: ${({ styles }) => `${styles.minHeight}vh`};
  min-width: ${({ styles }) => `${styles.minHWight}vw`};
`;

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

const ActionButton = styled(Button)`
  background-color: ${blue};
  color: ${white};
  font-weight: 100;
  border: none;
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
  ActionButton,
  CancelButton,
  CancelButtonX,
  TextInput,
  ModalText,
};

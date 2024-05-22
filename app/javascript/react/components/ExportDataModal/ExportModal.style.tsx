import styled from "styled-components";
import { white, blue, gray100, black } from "../../assets/styles/colors";
import { Button } from "../Button/Button.style";

interface ModalProps {
  isOpen: boolean;
  top: number;
  left: number;
  onKeyDown: React.KeyboardEventHandler<HTMLDialogElement>;
}

const ModalContainer = styled.div<ModalProps>`
  display: ${({ isOpen }) => (isOpen ? "flex" : "none")};
  justify-content: center;
  align-items: center;
  position: absolute;
  top: ${({ top }) => `${top}px`};
  left: ${({ left }) => `${left}px`};
  z-index: 999;
`;

const ModalContent = styled.div`
  background-color: ${white};
  opacity: 1;
  border-radius: 8px;
  position: relative;
  padding: 1rem;
  min-height: 10vh;
  min-width: 20vw;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 0.625rem;
`;

const FlexWrapper = styled.div`
  display: flex;
  padding-bottom: 0.625rem;
`;

const ActionButton = styled(Button)`
  background-color: ${blue};
  color: ${white};
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
  CancelButtonX,
  TextInput,
};

import styled from "styled-components";
import { white, blue, gray100 } from "../../assets/styles/colors";
import { H3 } from "../Typography/Typography.style";
import { Button } from "../Button/Button.style";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasIcon?: boolean;
}

const ModalContainer = styled.div<{
  isOpen: boolean;
  onKeyDown: React.KeyboardEventHandler<HTMLDialogElement>;
}>`
  display: ${({ isOpen }) => (isOpen ? "flex" : "none")};
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 999;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background-color: ${white};
  opacity: 1;
  border-radius: 8px;
  position: relative;
  padding: 20px;
  min-height: 20vh;
  min-width: 40vw;
`;

const ModalText = styled(H3)`
  size: 16px;
  color: black;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 5px;
  padding-top: 10px;
`;

const FlexWrapper = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 10px;
`;

const ActionButton = styled(Button)`
  background-color: ${blue};
  color: ${white};
  font-weight: 100;
  border: none;
`;

const CancelButton = styled(Button)`
  background-color: ${gray100};
  color: #000;
  font-weight: 100;
  border: none;
`;

const CancelButtonX = styled(Button)`
  color: #000;
  font-weight: 100;
  font-size: 18px;
  border: none;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 10px;
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

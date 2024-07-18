import styled from "styled-components";
import { blue, gray100, white } from "../../assets/styles/colors";
import { media } from "../../utils/media";
import { Button } from "../Button/Button.style";

interface ModalProps {
  isOpen: boolean;
  bottom: number;
  left: number;
  onKeyDown: React.KeyboardEventHandler<HTMLDialogElement>;
}

const ModalContent = styled.div`
  background-color: ${white};
  opacity: 1;
  border-radius: 8px;
  position: relative;
  padding: 2rem;
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
  @media ${media.desktop} {
    height: 30px;
    font-size: 1rem;
    img {
      width: 1rem;
      height: 1rem;
    }
  }
`;

const CancelButtonX = styled(Button)`
  color: black;
  font-weight: 100;
  border: none;

  @media ${media.desktop} {
    display: flex;
    align-items: center;
    height: auto;
    padding: 0;
    cursor: pointer;
    img {
      width: 1rem;
      height: 1rem;
    }
  }
`;

const TextInput = styled.input`
  width: 100%;
  padding: 0.625rem;
  border: 1px solid ${gray100};
  border-radius: 4px;
  margin-bottom: 0.625rem;
  outline: none;
  font-size: 1.6rem;
`;

const BlueButton = styled(Button)`
  background-color: ${blue};
  color: ${white};
  font-weight: 600;
  border: none;
  width: fit-content;
  font-size: 1.1rem;
  height: 0.8rem;
  text-transform: uppercase;
`;

const FormWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

export {
  ActionButton,
  BlueButton,
  ButtonsWrapper,
  CancelButtonX,
  FlexWrapper,
  FormWrapper,
  ModalContent,
  TextInput,
};

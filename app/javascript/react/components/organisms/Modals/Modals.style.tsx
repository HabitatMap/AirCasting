import styled from "styled-components";
import {
  acBlue,
  blue,
  gray100,
  gray400,
  white,
} from "../../../assets/styles/colors";
import { media } from "../../../utils/media";
import { Button } from "../../atoms/Button/Button.style";

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
  color: ${gray400};
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

const BannerWrapper = styled.div`
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: ${white};
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
  padding: 2rem 2.5rem;
  z-index: 1000;
  min-width: 340px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const BannerTitle = styled.h2`
  color: ${acBlue};
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 1rem;
`;

const BannerDescription = styled.p`
  color: #222;
  font-size: 1rem;
  margin-bottom: 1.5rem;
`;

const BannerActions = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
`;

const DenyButton = styled(BlueButton)`
  background: ${gray400};
  color: ${white};
`;

const SettingsButton = styled(BlueButton)`
  background: transparent;
  color: ${acBlue};
  border: 1.5px solid ${acBlue};
`;

export {
  ActionButton,
  BannerActions,
  BannerDescription,
  BannerTitle,
  BannerWrapper,
  BlueButton,
  ButtonsWrapper,
  CancelButtonX,
  DenyButton,
  FlexWrapper,
  FormWrapper,
  ModalContent,
  SettingsButton,
  TextInput,
};

import styled from "styled-components";
import { acBlue, gray100, gray300, white } from "../../assets/styles/colors";
import { Button } from "../Button/Button.style";

const SessionFilters = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: absolute;
  padding: 1.6rem 0.9rem;
  margin: 0.8rem 0 0 2rem;
  width: 30rem;
  border-radius: 10px;
  background-color: ${white};
`;

const SessionToggleWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  border-radius: 10px;
  height: 4.2rem;
`;

const Tab = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 1rem 3rem;
  background-color: ${(props) => (props.$isActive ? acBlue : gray100)};
  border: none;
  text-transform: uppercase;
  font-size: 1.4rem;
  color: ${(props) => (props.$isActive ? white : gray300)};
  cursor: pointer;

  &:first-child {
    border-radius: 10px 0 0 10px;
  }

  &:nth-child(2) {
    border-radius: 0 10px 10px 0;
  }
`;

const IconWrapper = styled.div<{ $isActive: boolean; $src: string }>`
  margin-left: 0.8rem;
  background-color: ${(props) => (props.$isActive ? white : gray300)};
  mask: url(${(props) => props.$src});
  mask-size: 100% 100%;
  width: 2rem;
  height: 2rem;
`;

const MobileSessionFilters = styled(SessionFilters)`
  top: 0;
  z-index: 2;
  margin: 0;
  width: 100%;
  height: 100%;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const HeaderTitle = styled.span`
  font-size: 1.6rem;
  margin-left: 1.6rem;

  &::first-letter {
    text-transform: uppercase;
  }
`;

const ShowSessionsButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border: none;
  background-color: ${acBlue};
  color: ${white};
  font-size: 1.4rem;
  text-transform: uppercase;
`;

export {
  Header,
  HeaderTitle,
  IconWrapper,
  MobileSessionFilters,
  ModalContent,
  SessionFilters,
  SessionToggleWrapper,
  ShowSessionsButton,
  Tab,
};

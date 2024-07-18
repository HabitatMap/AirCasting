import styled from "styled-components";
import { acBlue, gray100, gray300, white } from "../../assets/styles/colors";

const SessionFilters = styled.div`
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

export { IconWrapper, SessionFilters, SessionToggleWrapper, Tab };

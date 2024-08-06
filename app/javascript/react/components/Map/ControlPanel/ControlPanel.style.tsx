import styled from "styled-components";
import chevronDown from "../../../assets/icons/chevronDown.svg";
import { blue, gray200, gray400, white } from "../../../assets/styles/colors";
import { media } from "../../../utils/media";

const ControlPanelContainer = styled.div`
  background: ${white};
  cursor: auto;
  display: flex;
  font-size: 1.2rem;
  text-align: center;
  box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
  border-radius: 5px;
  gap: 0.4rem;
  padding: 0.4rem 0.5rem;
  @media ${media.smallDesktop} {
    font-size: 1.5rem;
    gap: 1rem;
    box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
    padding: 0;
    border-radius: 1rem;
  }
`;

const ToggleContainer = styled.div`
  display: none;
  @media ${media.smallDesktop} {
    display: flex;
    align-items: center;
    font-size: 1.4rem;
    padding: 1.5rem 1rem;
    height: 4.2rem;
  }
`;

const SwitchLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 36px;
  height: 18px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 36px;
  height: 18px;
  z-index: 2;
  position: relative;

  &:checked + span:before {
    transform: translateX(17px);
  }
`;

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${blue};
  transition: 0.4s;
  border-radius: 30px;
  z-index: 1;

  &:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 2.5px;
    bottom: 2px;
    padding: 0.7rem 0;
    background-color: ${white};
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const Label = styled.span<{ $isActive?: boolean }>`
  color: ${(props) => (props.$isActive ? blue : gray400)};
  margin: 0 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const TerrainContainer = styled.div`
  display: none;
  @media ${media.smallDesktop} {
    display: flex;
    align-items: center;
    font-size: 1.4rem;
    position: relative;
    border-left: 1px solid ${gray200};
    padding: 0 1.6rem;
  }
`;

const SelectContainer = styled.div`
  display: flex;

  @media ${media.smallDesktop} {
    display: none;
  }
`;

const Select = styled.select`
  background-color: ${white};
  border: none;
  outline: none;
  color: ${gray400};
  padding: 0 1.2rem 0 0.5rem;
  font-size: 1.4rem;

  background: transparent;
  background-image: url(${chevronDown});
  background-repeat: no-repeat;
  background-position-x: 100%;
  background-position-y: 5px;

  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
`;

export {
  ControlPanelContainer,
  Label,
  Select,
  SelectContainer,
  Slider,
  SwitchInput,
  SwitchLabel,
  TerrainContainer,
  ToggleContainer,
};

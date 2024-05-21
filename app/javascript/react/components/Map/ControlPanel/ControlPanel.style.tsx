import styled from "styled-components";
import {
  blue,
  gray100,
  gray200,
  gray300,
  gray400,
  white,
} from "../../../assets/styles/colors";
import { media } from "../../../utils/media";

const ControlPanelContainer = styled.div`
  background: ${white};
  cursor: auto;
  display: flex;
  font-size: 1.2rem;
  text-align: center;
  box-shadow: 2px 2px 4px 0px #4c56601a;
  border-radius: 5px;
  gap: 0.4rem;
  padding: 0.4rem 0.5rem;
  @media ${media.smallDesktop} {
    font-size: 1.5rem;
    padding: 1.5rem 1rem;
    gap: 1rem;
    border-radius: 10px;
    box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
  }
`;

const ToggleContainer = styled.div`
  display: none;
  @media ${media.smallDesktop} {
    display: flex;
    align-items: center;
    font-size: 1.6rem;
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
    transform: translateX(18px);
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
    left: 2px;
    bottom: 1.5px;
    padding: 0.8rem 0;
    background-color: ${white};
    transition: 0.4s;
    border-radius: 30px;
  }
`;

const Label = styled.span<{ isActive?: boolean }>`
  color: ${(props) => (props.isActive ? blue : gray400)};
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
    font-size: 1.6rem;
    margin-right: 10px;
    position: relative;
    border-left: 1px solid ${gray200};
  }
`;

const TerrainLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
`;

const TerrainCheckbox = styled.input`
  opacity: 0;
  width: 18px;
  height: 18px;
  position: absolute;
  z-index: 2;
  cursor: pointer;

  &:checked + span {
    background-color: ${white};
    border-color: ${blue};
  }

  &:checked + span:after {
    opacity: 1;
  }
`;

const RoundCheckbox = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${gray100};
  transition: 0.4s;
  border-radius: 50%;
  border: 1px solid ${gray200};

  &:after {
    border: 2px solid ${blue};
    border-top: none;
    border-right: none;
    content: "";
    height: 6px;
    left: 3px;
    opacity: 0;
    position: absolute;
    top: 4px;
    transform: rotate(-45deg);
    width: 12px;
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
`;

export {
  ControlPanelContainer,
  ToggleContainer,
  SwitchLabel,
  SwitchInput,
  Slider,
  Label,
  TerrainContainer,
  TerrainCheckbox,
  TerrainLabel,
  RoundCheckbox,
  SelectContainer,
  Select,
};

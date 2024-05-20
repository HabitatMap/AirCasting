import styled from "styled-components";
import { blue, gray400, white } from "../../../assets/styles/colors";

const ControlPanelsContainer = styled.div`
  font-size: 1.5rem;
  background: ${white};
  position: absolute;
  top: 5%;
  right: 30%;
  cursor: auto;
  display: flex;
  padding: 1.5rem 2.5rem;
  gap: 10px;
  border-radius: 10px;
  box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
`;

const TerrainContainer = styled.div`
  display: flex;
  &:before {
    content: "";
    position: absolute;
    right: 35%;
    top: 0;
    bottom: 0;
    width: 1px;
    background: gray;
    opacity: 0.4;
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
    padding: 8px 0;
    background-color: ${white};
    transition: 0.4s;
    border-radius: 30px;
  }
`;

const Label = styled.span<{ isActive: boolean }>`
  color: ${(props) => (props.isActive ? blue : gray400)};
  margin: 0 1rem;
`;

const TerrainCheckbox = styled.input`
  margin-left: 1rem;
  z-index: 2;
  position: relative;
`;

export {
  ControlPanelsContainer,
  ToggleContainer,
  SwitchLabel,
  SwitchInput,
  Slider,
  Label,
  TerrainContainer,
  TerrainCheckbox,
};

import styled from "styled-components";
import { white } from "../../../assets/styles/colors";

const ControlPanelsContainer = styled.div`
  font-size: 1.5rem;
  background: ${white};
  position: absolute;
  top: 5%;
  right: 30%;
  cursor: auto;
  display: flex;
  padding: 5px 16px 5px 16px;
  gap: 10px;
  border-radius: 10px;
  box-shadow: 2px 2px 4px 0px #4c56601a;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
`;

const SwitchLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;

  &:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const Input = styled.input`
  &:checked + ${Slider} {
    background-color: #2196f3;
  }

  &:checked + ${Slider}:before {
    transform: translateX(26px);
  }
`;

export {
  ControlPanelsContainer,
  ToggleContainer,
  SwitchLabel,
  SwitchInput,
  Slider,
  Input,
};

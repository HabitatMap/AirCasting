import styled from "styled-components";

import { NAVBAR_HEIGHT } from "../Navbar/Navbar.style";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const MapElementsContainer = styled.div`
  position: absolute;
  z-index: 2;
  display: flex;
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

export { MapElementsContainer, containerStyle };

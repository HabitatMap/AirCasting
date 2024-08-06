import styled from "styled-components";
import {
  blue,
  gray100,
  gray200,
  gray400,
  white,
} from "../../assets/styles/colors";

const ButtonContainer = styled.div<{
  $isActive?: boolean;
  $isColorStatic?: boolean;
}>`
  color: ${(props) =>
    props.$isActive && !props.$isColorStatic ? blue : gray400};
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Label = styled.span`
  display: inline-block;
  align-items: center;

  &::first-letter {
    text-transform: capitalize;
  }
`;

const ButtonCheckboxContainer = styled.label`
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
`;

const ButtonCheckbox = styled.input`
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
  min-width: 18px;

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

export {
  Label,
  ButtonCheckboxContainer,
  ButtonCheckbox,
  ButtonContainer,
  RoundCheckbox,
};

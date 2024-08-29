import styled from "styled-components";
import { acBlue, gray400, white } from "../../../assets/styles/colors";
import { Button } from "../../Button/Button.style";
import { H3 } from "../../Typography";

const LegendContainer = styled.div`
  display: grid;
  position: fixed;
  grid-template-rows: auto 1fr auto;
  gap: 2rem;
  bottom: 0;
  flex-direction: column;
  align-items: center;
  width: 100%;
  background-color: white;
  padding: 1.6rem;
  z-index: 2;
`;

const Header = styled.div`
  display: grid;
  justify-content: space-between;
  grid-template-columns: auto 1fr;
  gap: 1.6rem;
  width: 100%;
  min-height: 2.4rem;
  height: fit-content;
  align-items: center;
`;

const CloseButton = styled.button`
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  position: relative;
  width: 1.7rem;
  height: 1.7rem;

  &:before,
  &:after {
    content: "";
    position: absolute;
    top: (1.7rem - 0.1rem) / 2;
    left: 0;
    right: 0;
    height: 0.15rem;
    background: ${gray400};
  }

  &:before {
    transform: rotate(45deg);
  }

  &:after {
    transform: rotate(-45deg);
  }

  span {
    display: block;
  }
`;

const Title = styled(H3)`
  display: inline;
  font-size: 1.6rem;
  line-height: 1.92rem;
`;

const SliderContainer = styled.div`
  display: grid;
  gap: 1.6rem;
  grid-template-rows: auto 1fr;
  width: 100%;
`;

const ApplyButton = styled(Button)`
  background-color: ${acBlue};
  color: ${white};
  text-transform: uppercase;
  text-size: 1.4rem;
  border-radius: 0.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 3.6rem;
  border: none;
`;

export {
  ApplyButton,
  CloseButton,
  Header,
  LegendContainer,
  SliderContainer,
  Title,
};

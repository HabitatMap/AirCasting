import styled, { keyframes } from "styled-components";

import { theme } from "../../assets/styles/colors";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100dvh;
  width: 100%;
`;

const fillAnimation = keyframes`
  0% {
    fill: ${theme};
  }
  50% {
    fill: transparent;
  }
  100% {
    fill: ${theme};
  }
`;

const Loader = styled.div<{ width: string }>`
  height: fit-content;
  width: ${(props) => props.width};
  padding: 0px;
  display: flex;
`;

const Logo = styled.svg`
  width: 100%;
  height: 100%;

  path {
    fill: ${theme};
    animation: ${fillAnimation} 2s infinite alternate;
  }
`;

export { Container, Loader, Logo };

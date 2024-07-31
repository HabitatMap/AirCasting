import styled, { keyframes } from "styled-components";
import { white } from "../../../../assets/styles/colors";

const ZoomInContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.2rem;
  height: 2.8rem;
  border-radius: 25px;
  background-color: ${white};
  cursor: pointer;
  box-shadow: 2px 2px 4px 0px #4c56601a;
`;

const ZoomInIcon = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export { ZoomInContainer, ZoomInIcon };

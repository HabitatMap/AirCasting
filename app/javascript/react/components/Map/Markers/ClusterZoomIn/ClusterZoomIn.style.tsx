import styled, { css, keyframes } from "styled-components";

const ZoomInContainer = styled.div`
  display: flex;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const zoomInIconAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
`;

const ZoomInIcon = styled.div`
  width: 2rem;
  height: 2rem;
  background: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  animation: ${zoomInIconAnimation} 1s infinite;
`;

export { ZoomInContainer, ZoomInIcon };

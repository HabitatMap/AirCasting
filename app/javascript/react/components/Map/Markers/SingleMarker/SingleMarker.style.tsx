import styled from "styled-components";
import { gray400 } from "../../../../assets/styles/colors";
import { H4 } from "../../../Typography";

interface MarkerProps {
  color: string;
}

const MarkerContainer = styled.div`
  display: flex;
  position: absolute;
  // To match the position of the marker with the center of the shadow circle
  top: -2.5rem;
  left: -2.5rem;
  width: 11.5rem;
  height: 5rem;
  cursor: pointer;
  z-index: 100;
  pointer-events: auto;
`;

const ShadowCircle = styled.div<MarkerProps>`
  height: 4rem;
  width: 4rem;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    ${(props) => props.color} 0%,
    ${(props) => props.color} 30%,
    transparent 100%
  );
  filter: blur(5px);
  pointer-events: none;
`;

const DataContainer = styled.div`
  width: 7.5rem;
  height: 2.5rem;
  display: flex;
  position: absolute;
  //To calculate top position: ShadowCircleHeight/2- DataContainerHeight/2
  top: 0.75rem;
  //To calculate this position: ShadowCircleWidth/2-(MarkerCircleWidth/2+MarkerCirclePaddingLeft)
  left: 0.9rem;
  border-radius: 1.5rem;
  padding: 0.5rem 0.5rem 0.5rem 0.5rem;
  background-color: white;
  box-shadow: 0.125rem 0.125rem 0.25rem 0 rgba(76, 86, 96, 0.1);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  pointer-events: none;
`;

const MarkerCircle = styled.div<MarkerProps>`
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  pointer-events: none;
`;

const MarkerText = styled(H4)`
  color: ${gray400};
  font-size: 12px;
  font-weight: 400;
  pointer-events: none;
`;

export {
  MarkerContainer,
  ShadowCircle,
  DataContainer,
  MarkerCircle,
  MarkerText,
};

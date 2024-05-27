import styled from "styled-components";
import { gray100, gray400 } from "../../../assets/styles/colors";
import { H4 } from "../../Typography";

interface MarkerProps {
  color: string;
}

const MarkerContainer = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  width: 11.5rem; /* 115px */
  height: 5rem; /* 50px */
`;

const ShadowCircle = styled.div<MarkerProps>`
  height: 5rem;
  width: 5rem;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    ${(props) => props.color} 0%,
    ${(props) => props.color} 30%,
    transparent 100%
  );
  filter: blur(5px);
`;

const DataContainer = styled.div`
  width: 10rem;
  height: 3rem;
  display: flex;
  position: absolute;
  top: 1rem; // ShadowCircle/2- DataContainerHeight/2
  left: 1rem; // ShadowCircle/2-(MarkerCircle/2+MarkerCirclePaddingLeft)
  border-radius: 1.5rem; /* Completely round corners */
  padding: 0.5rem 0.5rem 0.5rem 0.5rem;
  background-color: white;
  box-shadow: 0.125rem 0.125rem 0.25rem 0 rgba(76, 86, 96, 0.1);
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const MarkerCircle = styled.div<MarkerProps>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${(props) => props.color};
`;

const MarkerText = styled(H4)`
  color: ${gray400};
  font-size: 1rem;
  font-weight: 400;
`;

export {
  MarkerContainer,
  ShadowCircle,
  DataContainer,
  MarkerCircle,
  MarkerText,
};

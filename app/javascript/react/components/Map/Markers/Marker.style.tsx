import styled from "styled-components";
import { gray400 } from "../../../assets/styles/colors";
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
    ${(props) => props.color} 10%,
    transparent 100%
  );
`;

const DataContainer = styled.div`
  width: 6.375rem;
  height: 1.75rem;
  display: flex;
  position: absolute;
  top: 1.625rem;
  left: 1.75rem; // 2.5-(1,25+0,25)/2
  border-radius: 1.25rem;
  padding: 0.25rem 0.5625rem 0.25rem 0.25rem;
  background-color: white;
  box-shadow: 0.125rem 0.125rem 0.25rem 0 rgba(76, 86, 96, 0.1);
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const MarkerCircle = styled.div<MarkerProps>`
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background-color: ${(props) => props.color};
`;

const MarkerText = styled(H4)`
  color: ${gray400};
  font-size: 0.9rem;
  font-weight: 400;
`;

export {
  MarkerContainer,
  ShadowCircle,
  DataContainer,
  MarkerCircle,
  MarkerText,
};

import styled from "styled-components";
import { H4 } from "../../Typography";
import { gray300 } from "../../../assets/styles/colors";

interface MarkerProps {
  color: string;
}

const MarkerContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const ShadowCircle = styled.div<MarkerProps>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    ${(props) => props.color} 0%,
    ${(props) => props.color} 50%,
    ${(props) => props.color} 100%
  );
`;

const DataContainer = styled.div`
  width: 102px;
  height: 28px;
  position: absolute;
  top: 305px;
  left: 1123px;
  border-radius: 20px;
  padding: 4px 9px 4px 4px;
  background-color: white;
  box-shadow: 2px 2px 4px 0 rgba(76, 86, 96, 0.1);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MarkerCircle = styled.div<MarkerProps>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
`;

const MarkerText = styled.H4`
  font-color: ${gray300};
`;

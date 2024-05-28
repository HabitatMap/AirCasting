import styled from "styled-components";
import { gray100, gray400 } from "../../../assets/styles/colors";
import { H4 } from "../../Typography";

interface MarkerProps {
  color: string;
}

const SelectedShadowCircle = styled.div<MarkerProps>`
  height: 5rem;
  width: 5rem;
  border-radius: 50%;
  background-color: ${(props) => props.color + "66"};
  pointer-events: none;
`;

const SelectedDataContainer = styled.div`
  width: 10rem;
  height: 3rem;
  display: flex;
  position: absolute;
  top: 1rem; // ShadowCircle/2- DataContainerHeight/2
  left: 1rem; // ShadowCircle/2-(MarkerCircle/2+MarkerCirclePaddingLeft)
  border-radius: 1.5rem;
  border: 1px solid ${(props) => props.color};
  padding: 0.5rem 0.5rem 0.5rem 0.5rem;
  background-color: white;
  /* box-shadow: 0.125rem 0.125rem 0.25rem 0 rgba(76, 86, 96, 0.1); */
  display: flex;
  align-items: center;
  gap: 0.25rem;
  pointer-events: none;
`;

export { SelectedShadowCircle, SelectedDataContainer };

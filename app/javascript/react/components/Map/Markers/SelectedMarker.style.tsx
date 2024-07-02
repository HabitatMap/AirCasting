import styled from "styled-components";

interface MarkerProps {
  color: string;
}

const SelectedShadowCircle = styled.div<MarkerProps>`
  height: 4rem;
  width: 4rem;
  border-radius: 50%;
  background-color: ${(props) => props.color + "66"};
  pointer-events: none;
`;

const SelectedDataContainer = styled.div`
  min-width: fit-content;
  height: 2rem;
  display: flex;
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 1.5rem;
  border: 1px solid ${(props) => props.color};
  padding: 0.5rem;
  background-color: white;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  pointer-events: none;
`;

export { SelectedDataContainer, SelectedShadowCircle };

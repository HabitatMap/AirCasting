import styled from "styled-components";

interface StreamMarkerProps {
  color: string;
}

const StreamMarkerCircle = styled.div<StreamMarkerProps>`
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  position: absolute;
  transform: translate(-50%, -50%); /* Center the marker */
  pointer-events: auto;

  &:hover {
    cursor: pointer;
  }
`;

export { StreamMarkerCircle };

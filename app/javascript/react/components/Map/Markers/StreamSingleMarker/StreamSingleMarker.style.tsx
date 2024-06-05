import styled from "styled-components";

interface StreamMarkerProps {
  color: string;
}

const StreamMarkerCircle = styled.div<StreamMarkerProps>`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: ${(props) => props.color};
`;

export { StreamMarkerCircle };

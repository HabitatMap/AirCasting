import styled from "styled-components";

interface StreamMarkerProps {
  color: string;
}

const StreamMarkerCircle = styled.div<StreamMarkerProps>`
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background-color: ${(props) => props.color};

  &:hover {
    cursor: pointer;
  }
`;

export { StreamMarkerCircle };

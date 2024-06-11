import styled from "styled-components";

interface ClusterProps {
  color: string;
}

const InnerCircle = styled.div<ClusterProps>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  pointer-events: none;
`;

const OuterCircle = styled.div<ClusterProps>`
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  border: 0.1rem solid ${(props) => props.color};
  pointer-events: none;
`;

const ClusterContainer = styled.div`
  display: flex;
  justify-content: center;
  position: absolute;
  cursor: pointer;
  z-index: 100;
`;

export { InnerCircle, OuterCircle, ClusterContainer };

import styled from "styled-components";
import { blue } from "../../../../assets/styles/colors";

const MarkerCircle = styled.div`
  width: 1.6rem;
  height: 1.6rem;
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  background-color: ${blue};
  border-radius: 50%;
`;

export { MarkerCircle };

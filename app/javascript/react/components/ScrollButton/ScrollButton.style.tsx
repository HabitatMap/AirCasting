import styled from "styled-components";
import { gray200 } from "../../assets/styles/colors";

const ScrollButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid ${gray200};
  background-color: white;
`;

export { ScrollButton };

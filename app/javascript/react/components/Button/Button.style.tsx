import styled from "styled-components";
import { gray200 } from "../../assets/styles/colors";

const Button = styled.button`
  font-weight: 400;
  font-size: 14px;
  letter-spacing: 0.14px;
  height: 42px;
  border-radius: 5px;
  padding: 16px;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
  display: flex;
  border: 1px solid ${gray200};
  background-color: transparent;
  cursor: pointer;
`;

export { Button };

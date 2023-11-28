import styled from "styled-components";
import { lightGray } from "../../assets/styles/colors";

const HeaderButton = styled.button`
  font-weight: 400;
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 0.14px;
  height: 42px;
  border-radius: 5px;
  padding: 16px;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
  display: flex;
  border: 1px solid ${lightGray};
  background-color: transparent;
`;

export { HeaderButton };

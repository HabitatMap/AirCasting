import styled from "styled-components";
import { white } from "../../../assets/styles/colors";

const ActionButton = styled.button`
  background-color: ${white};
  border: none;
  border-radius: 10px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s, box-shadow 0.3s;
  width: 42px;
  height: 42px;
  margin-right: 5px;
`;

export { ActionButton };

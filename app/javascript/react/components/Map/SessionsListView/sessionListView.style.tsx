import styled from "styled-components";
import { gray100, gray400, red } from "../../../assets/styles/colors";

const SessionListViewStyle = styled.div`
  position: fixed;
  top: 100px;
  bottom: 0;
  right: 20px;
  overflow-y: auto;  
  overflow-x: hidden;
  border-radius: 8px;   
  box-sizing: border-box;
  padding-right: 10px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(62, 68, 73, 0.6);
    border-radius: 0px;
  }

  &::-webkit-scrollbar-track {
    background: ${gray100};
  }
`;

export {
    SessionListViewStyle
};

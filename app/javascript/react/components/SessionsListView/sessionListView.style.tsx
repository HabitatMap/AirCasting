import styled from "styled-components";
import { gray100 } from "../../assets/styles/colors";

const SessionListViewStyle = styled.div`
  position: fixed;
  top: 8em;
  bottom: 0;
  right: 1.25em;
  overflow-y: auto;  
  overflow-x: hidden;
  border-radius: 0.5em;
  box-sizing: border-box;
  padding-right: 0.625em;

  &::-webkit-scrollbar {
    width: 0.5em;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(62, 68, 73, 0.6);
    border-radius: 0;
  }

  &::-webkit-scrollbar-track {
    background: ${gray100};
  }
`;

export {
    SessionListViewStyle
};

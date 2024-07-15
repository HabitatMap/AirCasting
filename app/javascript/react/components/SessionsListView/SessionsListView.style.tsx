import styled from "styled-components";

import { gray100 } from "../../assets/styles/colors";

const SessionListViewStyle = styled.div`
  position: fixed;
  top: 10.5rem;
  bottom: 0;
  right: 1.25rem;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 0.5rem;
  box-sizing: border-box;
  padding-right: 0.8rem;
  z-index: 1;

  &::-webkit-scrollbar {
    width: 0.6rem;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(62, 68, 73, 0.6);
    border-radius: 0;
  }

  &::-webkit-scrollbar-track {
    background: ${gray100};
  }

  /* Firefox specific scrollbar styles */
  scrollbar-width: thin;
  scrollbar-color: rgba(62, 68, 73, 0.6) ${gray100};
`;

export { SessionListViewStyle };

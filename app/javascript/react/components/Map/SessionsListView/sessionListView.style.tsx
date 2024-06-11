import styled from "styled-components";

const SessionListViewStyle = styled.div`
  position: fixed;
  top: 100px;
  bottom: 0;
  right: 20px;
  overflow-y: auto;  
  border-radius: 8px;   
  box-sizing: border-box;

  &::-webkit-scrollbar {
    display: none; 
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

export {
    SessionListViewStyle
};

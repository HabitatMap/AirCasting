import styled from "styled-components";
import { H4 } from "../../Typography";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 1.0);
  z-index: 500;
  display: flex;
  justify-content: center;
  align-items: flex-start; // Align items to the top
`;


const ImageButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
`;

const Image = styled.img`
  width: 24px;
  height: 24px;
`;

const Title = styled(H4)`
  text-align: left;
  font-weight: 600;
`;

const HorizontalContainer = styled.div`
  width: 100%;
  display: flex;
//   left: 0;
  align-items: center;
  margin-bottom: 10px;
  margin-left: 15px;
`;

const VerticalContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 20px; // Give some space from the top
  overflow-y: auto; // Add scrolling to VerticalContainer if needed
  max-height: 100%; // Make sure it doesn't overflow the viewport
`;

const SessionListStyled = styled.div`
  width: 100%;
  overflow-y: auto;
  margin-left: 20px;
  margin-right: 20px;
`;


export { Overlay, Image, ImageButton, Title, HorizontalContainer, SessionListStyled, VerticalContainer };

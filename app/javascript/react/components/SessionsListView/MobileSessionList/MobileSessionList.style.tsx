import styled from "styled-components";
import { H4 } from "../../Typography";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 1);
  z-index: 500;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const ImageButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.625rem;
`;

const Image = styled.img`
  width: 2rem;
  height: 2rem;
`;

const Title = styled(H4)`
  text-align: left;
  font-weight: 400;
  font-size: 1.8rem;
`;

const HorizontalContainer = styled.div`
  width: 100%;
  display: flex;
  left: 0;
  align-items: center;
  padding: 0.5rem 1rem 2rem 1.5rem;
  gap: 1rem;
`;

const VerticalContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 1.25rem;
  max-height: 100%;
`;

const SessionListStyled = styled.div`
  width: 100%;
  overflow-y: auto;
  margin-left: 1.25rem;
  margin-right: 1.25rem;
`;

export {
  HorizontalContainer,
  Image,
  ImageButton,
  Overlay,
  SessionListStyled,
  Title,
  VerticalContainer,
};

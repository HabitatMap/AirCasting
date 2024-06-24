import styled from "styled-components";
import { H6 } from "../Typography";

const StyledSectionButton = styled.button`
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 0.4rem 0.8rem rgba(0, 0, 0, 0.1);
  margin-bottom: 0.4rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 8.5rem;
  height: 4.2rem;
  position: fixed;
  bottom: 0;
  right: 1.25rem;
  border: none;
`;

const Title = styled(H6)``;

const Image = styled.img`
  width: 1rem;
  height: 1.2rem;
  margin-bottom: 0.25rem;
`;

export { StyledSectionButton, Title, Image };

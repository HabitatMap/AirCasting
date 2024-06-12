import styled from "styled-components";
import { H6 } from "../../Typography";

const StyledSectionButton = styled.button`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 5px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 85px;
  height: 42px;
  position: fixed;
  bottom: 0;
  right: 20px;
`;

const Title = styled(H6)``;

const Image = styled.img`
  width: 10px;
  height: 12px;
  margin-bottom: 4px;
`;

export { StyledSectionButton, Title, Image };

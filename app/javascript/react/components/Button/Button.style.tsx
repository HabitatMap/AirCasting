import styled, { css } from "styled-components";
import { buttonText } from "../../assets/styles/Typography";
import { lightGray } from "../../assets/styles/colors";

const buttonGeneralStyles = css`
  ${buttonText}
  height: 42px;
  border-radius: 5px;
  padding: 16px;
  align-items: center;
  gap: 10px;
`;

const Button = styled.button`
  ${buttonGeneralStyles}
`;

const HeaderButton = styled(Button)`
  justify-content: flex-end;
  display: flex;
  border: 1px solid ${lightGray};
  background-color: transparent;
`;

export { HeaderButton };

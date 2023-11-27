import styled, { css } from "styled-components";
import { lightGray } from "../../assets/styles/colors";

const buttonText = css`
  font-weight: 400;
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 0.14px;
`;

const buttonGeneralStyles = css`
  ${buttonText}
  height: 42px;
  border-radius: 5px;
  padding: 16px;
  align-items: center;
  gap: 10px;
`;

const HeaderButton = styled.button`
  ${buttonGeneralStyles}
  justify-content: flex-end;
  display: flex;
  border: 1px solid ${lightGray};
  background-color: transparent;
`;

export { HeaderButton };

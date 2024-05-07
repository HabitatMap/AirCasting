import styled from "styled-components";
import { media } from "../../utils/media";
import { gray100, gray200 } from "../../assets/styles/colors";

const ScrollButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 40px;
  background-color: ${gray100};

  @media ${media.desktop} {
    width: 40px;
    border-radius: 50%;
    border: 1px solid ${gray200};
    background-color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;  // Change cursor to indicate the button is disabled
  }
`;

export { ScrollButton };

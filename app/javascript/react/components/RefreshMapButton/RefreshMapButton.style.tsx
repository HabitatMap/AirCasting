import styled from "styled-components";
import { blue, white } from "../../assets/styles/colors";
import { media } from "../../utils/media";
import { Button } from "../Button/Button";

const RefreshButton = styled(Button)`
  border-radius: 10px;
  border: none;
  color: ${white};
  background-color: ${blue};
  font-size: 14px;
  padding: 0 5px;
  margin: 0 8px;
  height: 42px;

  @media ${media.largeDesktop} {
    font-size: 16px;
    padding: 0 50px;
    margin: 0 16px;
  }
`;

export { RefreshButton };

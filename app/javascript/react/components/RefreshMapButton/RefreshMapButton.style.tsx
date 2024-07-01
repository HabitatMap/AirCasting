import styled from "styled-components";
import { blue, white } from "../../assets/styles/colors";
import { media } from "../../utils/media";
import { Button } from "../Button/Button";

const RefreshButton = styled(Button)`
  border-radius: 5px;
  border: none;
  color: ${white};
  background-color: ${blue};
  font-size: 1.4rem;
  padding: 0 1rem;
  height: 4rem;

  @media ${media.smallDesktop} {
    border-radius: 10px;
    margin: 0 0.8rem;
    height: 4.2rem;
  }

  @media ${media.largeDesktop} {
    font-size: 1.6rem;
    margin: 0 1.6rem;
    padding: 0 5rem;
  }
`;

export { RefreshButton };

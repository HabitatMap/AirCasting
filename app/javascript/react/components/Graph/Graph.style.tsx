import styled from "styled-components";
import { media } from "../../utils/media";

const Container = styled.div`
  width: 100%;
  max-height: 20rem;
  @media ${media.smallDesktop} {
    width: 80%;
    flex-direction: column;
  }
`;

export { Container };

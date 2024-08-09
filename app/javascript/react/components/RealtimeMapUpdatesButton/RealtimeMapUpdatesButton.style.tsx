import styled from "styled-components";
import { gray900, white } from "../../assets/styles/colors";
import { media } from "../../utils/media";

const RealtimeMapUpdatesButtonContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.4rem;
  height: 2.4rem;
  position: relative;
  background-color: ${white};
  box-shadow: 2px 2px 4px 0px ${gray900};
  border-radius: 0.5rem;
  padding: 0 0.9rem;

  @media ${media.smallDesktop} {
    font-size: 1.4rem;
    height: 4.2rem;
    padding: 0 1.6rem;
    border-radius: 1rem;
  }
`;

export { RealtimeMapUpdatesButtonContainer };

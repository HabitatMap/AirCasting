import styled from "styled-components";

import { media } from "../../../../../utils/media";
import { H4 } from "../../../../atoms/Typography";

const DataDescription = styled(H4)`
  display: inline;
  font-weight: 500;
  text-transform: uppercase;

  @media ${media.desktop} {
    display: block;
    text-transform: none;
    font-size: 18px;
    font-weight: 400;
  }
`;

export { DataDescription };

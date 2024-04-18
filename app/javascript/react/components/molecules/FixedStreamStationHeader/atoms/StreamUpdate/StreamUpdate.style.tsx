import styled from "styled-components";

import { H5 } from "../../../../Typography";
import { media } from "../../../../../utils/media";

const DateLabel = styled(H5)`
  display: inline;
  font-weight: 600;
  text-transform: uppercase;

  @media ${media.desktop} {
    display: block;
    text-transform: none;
    font-weight: 400;
    font-size: 14px;
  }
`;

const FrequencyLabel = styled(H5)`
  display: inline;

  @media ${media.desktop} {
    display: block;
    font-size: 14px;
  }
`;

export { DateLabel, FrequencyLabel };

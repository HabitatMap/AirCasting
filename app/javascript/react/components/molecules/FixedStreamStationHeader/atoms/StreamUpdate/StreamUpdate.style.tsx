import styled from "styled-components";

import { media } from "../../../../../utils/media";
import { H5 } from "../../../../atoms/Typography";

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

const RangeLabel = styled(H5)`
  display: inline;

  .hyphen-padding {
    padding: 0 8px;
  }

  @media ${media.desktop} {
    display: block;
    font-size: 14px;
  }
`;

export { DateLabel, FrequencyLabel, RangeLabel };

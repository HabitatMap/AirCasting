import styled from "styled-components";

import { gray300 } from "../../../../../assets/styles/colors";
import { media } from "../../../../../utils/media";
import { H1, H5 } from "../../../../Typography";

const Label = styled(H5)`
  padding-bottom: 10px;
  font-weight: 500;
  text-transform: uppercase;

  @media ${media.desktop} {
    color: ${gray300};
    font-size: 14px;
    font-weight: 400;
  }
`;

const Heading = styled(H1)`
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media ${media.desktop} {
    font-size: 28px;
  }
`;

export { Heading, Label };

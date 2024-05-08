import styled from "styled-components";

import { media } from "../../../../../utils/media";
import { H1, H5 } from "../../../../Typography";
import { gray300 } from "../../../../../assets/styles/colors";

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
  padding-bottom: 10px;
  font-weight: 600;

  @media ${media.desktop} {
    font-size: 28px;
    font-weight: 500;
  }
`;

export { Label, Heading };

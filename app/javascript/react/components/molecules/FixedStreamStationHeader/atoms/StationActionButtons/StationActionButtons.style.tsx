import styled from "styled-components";

import media from "../../../../../utils/media";

const MobileButtons = styled.div`
  display: flex;
  gap: 24px;

  @media ${media.desktop} {
    display: none;
  }
`;

const DesktopButtons = styled.div`
  display: none;

  @media ${media.desktop} {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }
`;

export { MobileButtons, DesktopButtons };

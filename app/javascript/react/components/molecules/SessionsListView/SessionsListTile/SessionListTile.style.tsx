import styled from "styled-components";

import { gray100, gray200, white } from "../../../../assets/styles/colors";
import { media } from "../../../../utils/media";
import { H4, H5 } from "../../../atoms/Typography";

interface DotProps {
  $color: string;
  $isAvg?: boolean;
}

interface SessionListTileProps {
  $isIndoor?: boolean;
}

const SessionListTile = styled.div<SessionListTileProps>`
  cursor: pointer;
  background-color: ${white};
  border-radius: 1rem;
  border: 1px solid ${gray100};
  box-shadow: 0 0.4rem 0.8rem rgba(0, 0, 0, 0.1);
  padding: ${({ $isIndoor }) => ($isIndoor ? "0.6rem 1rem" : "0.5rem 1rem")};
  margin-right: 0.9375rem;
  margin-left: 0.9375rem;
  box-sizing: border-box;

  @media (${media.desktop}) {
    margin-right: 0rem;
    margin-left: 0rem;
    width: 230px;
  }
`;

interface HorizontalSpacingContainerProps {
  $isIndoor?: boolean;
}

const HorizontalSpacingContainer = styled.div<HorizontalSpacingContainerProps>`
  display: flex;
  align-items: left;
  justify-content: space-between;
  margin-top: ${({ $isIndoor }) => ($isIndoor ? "0.4rem" : "0.5rem")};
  margin-bottom: ${({ $isIndoor }) => ($isIndoor ? "0.6rem" : "0.8rem")};
`;

const HorizontalGroup = styled.div`
  display: flex;
  align-items: left;
`;

const ColorDot = styled.span<DotProps>`
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: ${(props) => props.$color};
  border-radius: 50%;
  margin-right: 0.8rem;
  border: ${(props) => (props.$isAvg ? "none" : `1px solid ${gray200}`)};
`;

interface TitleProps {
  $isIndoor?: boolean;
}

const Title = styled(H4)<TitleProps>`
  text-align: left;
  font-weight: 500;
  margin-bottom: ${({ $isIndoor }) => ($isIndoor ? "0.6rem" : "0.8rem")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface SubtitleProps {
  $isIndoor?: boolean;
}

const Subtitle = styled(H5)<SubtitleProps>`
  text-align: left;
  margin-bottom: ${({ $isIndoor }) => ($isIndoor ? "0.6rem" : "0.8rem")};
`;

const ArrowImageContainer = styled.div`
  width: 1.5rem;
  height: 1.35rem;

  @media (${media.desktop}) {
    display: none;
  }
`;

export {
  ArrowImageContainer,
  ColorDot,
  HorizontalGroup,
  HorizontalSpacingContainer,
  SessionListTile,
  Subtitle,
  Title,
};

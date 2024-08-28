import styled from "styled-components";

import { gray100, white } from "../../../assets/styles/colors";
import { media } from "../../../utils/media";
import { H4, H5 } from "../../Typography";

interface DotProps {
  $color: string;
}

const SessionListTile = styled.div`
  cursor: pointer;
  background-color: ${white};
  border-radius: 1rem;
  border: 1px solid ${gray100};
  box-shadow: 0 0.4rem 0.8rem rgba(0, 0, 0, 0.1);
  padding: 0.5rem 1rem 0.5rem 1rem;
  margin-right: 0.9375rem;
  margin-left: 0.9375rem;
  box-sizing: border-box;

  @media (${media.desktop}) {
    margin-right: 0rem;
    margin-left: 0rem;
    width: 230px;
  }
`;

const HorizontalSpacingContainer = styled.div`
  display: flex;
  align-items: left;
  justify-content: space-between;
  margin-top: 0.5rem;
  margin-bottom: 0.8rem;
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
`;

const Title = styled(H4)`
  text-align: left;
  font-weight: 500;
  margin-bottom: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Subtitle = styled(H5)`
  text-align: left;
  margin-bottom: 0.8rem;
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

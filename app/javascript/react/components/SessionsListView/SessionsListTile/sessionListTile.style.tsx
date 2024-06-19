import styled from "styled-components";
import { H4, H5 } from "../../Typography";
import { media } from "../../../utils/media";
import { red } from "../../../assets/styles/colors";

interface DotProps {
  $color?: string;
}

const SessionListTile = styled.div`
  cursor: pointer;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 0.5em 1em 0.5em 1em;
  margin-bottom: 0.9375em;
  margin-right: 0.9375em;
  margin-left: 0.9375em;
  box-sizing: border-box;
  min-width: 200px;

  @media (${media.desktop}) {
    margin-right: 0em;
    margin-left: 0em;
  }
`;

const HorizontalContainer = styled.div`
  display: flex;
  align-items: left;
  justify-content: flex-start;
  margin-bottom: 0.625em;
  margin-top: 0.5em;
`;

const ColorDot = styled.span<DotProps>`
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: ${red};
  border-radius: 50%;
  margin-right: 0.3125em;
`;

const Title = styled(H4)`
  text-align: left;
  font-weight: 600;
  margin-bottom: 0.5em;
`;

const Subtitle = styled(H5)`
  text-align: left;
  margin-bottom: 0.5em;
`;

export { SessionListTile, HorizontalContainer, Title, Subtitle, ColorDot };

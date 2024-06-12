import styled from "styled-components";
import { H4, H5 } from "../../Typography";
import { media } from "../../../utils/media";
import { red } from "../../../assets/styles/colors";

interface DotProps {
  $color?: string;
}

const SessionListTile = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 16px 8px 16px 8px;
  margin-bottom: 15px;
  margin-right: 15px;
  margin-left: 15px;
  box-sizing: border-box;
  min-width: 200px;

  @media (${media.desktop}) {
    margin-right: 0px;
    margin-left: 0px;
  }
`;

const HorizontalContainer = styled.div`
  display: flex;
  align-items: left;
  justify-content: flex-start;
  margin-bottom: 10px;
`;

const ColorDot = styled.span<DotProps>`
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: ${red};;
  border-radius: 50%;
  margin-right: 5px;
`;

const Title = styled(H4)`
  text-align: left;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Subtitle = styled(H5)`
  text-align: left;
  margin-bottom: 8px;
`;

export { SessionListTile, HorizontalContainer, Title, Subtitle, ColorDot };

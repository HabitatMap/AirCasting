import styled from "styled-components";
import { H4, H5 } from "../../Typography";

const SessionListTile = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 16px 8px 16px 8px;
  margin-bottom: 15px;
  box-sizing: border-box;
  min-width: 200px;
`;

const HorizontalContainer = styled.div`
  display: flex;
  align-items: left;
  justify-content: flex-start;
  margin-bottom: 10px;
`;

const RedDot = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: red;
  border-radius: 50%;
  margin-right: 5px;
`;

const Title = styled(H4)`
  text-align: left;
  font-weight: 600;
`;

const Subtitle = styled(H5)`
  text-align: left;
`;

export { SessionListTile, HorizontalContainer, Title, Subtitle, RedDot };

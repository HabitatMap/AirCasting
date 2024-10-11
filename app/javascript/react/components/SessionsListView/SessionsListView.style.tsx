import styled from "styled-components";

import { blue, gray400 } from "../../assets/styles/colors";
import { SessionListTile } from "./SessionsListTile/SessionListTile.style";

const SessionListViewStyle = styled.div`
  position: fixed;
  top: 10.5rem;
  right: 1.25rem;
  bottom: 6.4rem;
  border-radius: 0.5rem;
  box-sizing: border-box;
  padding-right: 0.8rem;
  width: 25rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SessionListTitle = styled.span`
  text-transform: uppercase;
  font-weight: 400;
  font-size: 1.2rem;
  color: ${gray400};
  align-items: center;

  &:nth-of-type(2) {
    margin-left: 0.3rem;
  }
`;

const SessionListInfoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SessionListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  width: calc(100% + 1rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1rem;

  @-moz-document url-prefix() {
    width: calc(100% + 2rem);
  }

  &::-webkit-scrollbar-button:end:decrement {
    padding-bottom: 1rem;
  }
`;

const ExportSessionsButton = styled.button<{ $hasSessions: boolean }>`
  background-color: transparent;
  color: ${blue};
  border: none;
  font-size: 1.2rem;
  text-transform: uppercase;
  cursor: ${({ $hasSessions }) => ($hasSessions ? "pointer" : "default")};
`;

const SessionInfoTile = styled(SessionListTile)`
  display: flex;
  gap: 0.5rem;
  justify-content: space-around;
  align-items: center;
  padding: 1rem;
  cursor: default;
`;

const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  background-color: transparent;
  border: none;
  cursor: pointer;
`;

const RotatedIcon = styled.img<{ $rotated: boolean }>`
  transform: ${({ $rotated }) => ($rotated ? "rotate(180deg)" : "none")};
  width: 1.5rem;
  height: 1.5rem;
  margin-right: 0.3rem;
`;

export {
  ExpandButton,
  ExportSessionsButton,
  RotatedIcon,
  SessionInfoTile,
  SessionListContainer,
  SessionListInfoContainer,
  SessionListTitle,
  SessionListViewStyle,
};

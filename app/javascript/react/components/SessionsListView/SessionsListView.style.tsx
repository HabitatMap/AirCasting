import styled from "styled-components";

import { blue, gray100, gray400 } from "../../assets/styles/colors";
import { media } from "../../utils/media";
import { SessionListTile } from "./SessionsListTile/SessionListTile.style";

const SessionListViewStyle = styled.div`
  position: fixed;
  top: 10.5rem;
  bottom: 0;
  right: 1.25rem;
  border-radius: 0.5rem;
  box-sizing: border-box;
  padding-right: 0.8rem;
  z-index: 3;
  display: flex;
  flex-direction: column;

  @media (${media.desktop}) {
    bottom: 6.4rem;
  }
`;

const SessionListTitle = styled.span`
  text-transform: uppercase;
  font-weight: 400;
  font-size: 1.2rem;
  color: ${gray400};
  align-items: center;
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

  &::-webkit-scrollbar {
    width: 0.6rem;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(62, 68, 73, 0.6);
    border-radius: 0;
  }

  &::-webkit-scrollbar-track {
    background: ${gray100};
  }

  /* Firefox specific scrollbar styles */
  scrollbar-width: thin;
  scrollbar-color: rgba(62, 68, 73, 0.6) ${gray100};
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
  padding: 1rem;
  cursor: pointer;
`;

export {
  ExportSessionsButton,
  SessionInfoTile,
  SessionListContainer,
  SessionListInfoContainer,
  SessionListTitle,
  SessionListViewStyle,
};

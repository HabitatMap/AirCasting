import styled from "styled-components";

import { gray400, white } from "../../../../assets/styles/colors";
import { CloseButton } from "../../Legend/Legend.style";

const PopoverContainer = styled.div`
  position: relative;
  z-index: 3;
`;

export const NoteButton = styled.button`
  position: absolute;
  background-color: ${white};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 30px;
  height: 30px;
`;

const NoteContainer = styled.div`
  position: absolute;
  top: 0;
  left: 30px; // Adjust as needed
  background: ${white};
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const NoteButtonIcon = styled.img`
  width: 20px;
  height: 20px;
`;

// const NoteContainer = styled.div`
//   background-color: ${white};
//   border: none;
//   border-radius: 2rem;
//   display: flex;
//   flex-direction: column;
//   font-size: 1.4rem;
//   font-weight: 400;
//   padding: 1rem;
// `;

const DataContainer = styled.div`
  margin: 1rem 0 2rem 0;
`;

const ClosePopoverButton = styled(CloseButton)`
  align-self: flex-end;
`;

const NoteInfoContainer = styled.div`
  display: flex;
`;

const NoteInfoText = styled.span`
  display: flex;
  flex-direction: row;
  white-space: nowrap;
`;

const NoteInfoBoldText = styled.span`
  color: ${gray400};
  font-weight: 700;
  margin: 0rem 0.5rem 0rem 0rem;
  white-space: nowrap;
`;

const PhotoContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const Photo = styled.img`
  width: 100%;
`;

export {
  ClosePopoverButton,
  DataContainer,
  NoteButtonIcon,
  NoteContainer,
  NoteInfoBoldText,
  NoteInfoContainer,
  NoteInfoText,
  Photo,
  PhotoContainer,
  PopoverContainer,
};

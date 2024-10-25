import styled from "styled-components";
import {
  gray100,
  gray400,
  grey,
  white,
} from "../../../../assets/styles/colors";
import { media } from "../../../../utils/media";
import { H4 } from "../../../Typography";

const NoteButton = styled.button`
  position: absolute;
  background-color: ${white};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 3;
`;

const NoteButtonIcon = styled.img`
  width: 2rem;
  height: 2rem;
`;

const NoteContainer = styled.div<{ $oneNote?: boolean }>`
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 4rem;
  left: 0;
  background: ${white};
  border-radius: 1rem;
  padding: 1.8rem 0.8rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 4;
`;

const SlideContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SlideContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;

  margin: 0 1.4rem;

  @media ${media.desktop} {
    flex-direction: row;
    align-items: flex-start;
  }
`;

const DataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const NoteInfoContainer = styled.div`
  display: flex;
  gap: 4px;
`;

const Photo = styled.img`
  width: 9rem;
  height: 9rem;
  border-radius: 4px;
  margin-top: 1.4rem;

  @media ${media.desktop} {
    margin-right: 1.8rem;
    margin-top: 0;
  }
`;

const SliderControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  padding: 0 0.8rem;
`;

const SliderButton = styled.button`
  background: ${gray100};
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.2rem;
  height: 3.2rem;
  min-width: 3.2rem;

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const SliderButtonIcon = styled.img<{ $left?: boolean }>`
  width: 1.6rem;
  height: 1.6rem;
  transform: ${(props) => (props.$left ? "rotate(180deg)" : "none")};
`;

const SliderDots = styled.div`
  display: flex;
  gap: 0.8rem;
  align-items: center;
  justify-content: center;
  flex: 1;
`;

const SliderDot = styled.button<{ $active: boolean }>`
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  border: none;
  background-color: ${(props) => (props.$active ? grey : "#D9D9D9")};
  cursor: pointer;
  padding: 0;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${grey};
  }
`;

const ReadMore = styled.span`
  display: block;
  color: ${gray400};
  cursor: pointer;
  font-weight: 700;
  text-decoration: underline;
  margin-top: 0.4rem;
`;

const NoteText = styled(H4)`
  margin-left: 0.8rem;
`;

const NoteDate = styled(NoteText)`
  white-space: nowrap;
`;

export {
  DataContainer,
  NoteButton,
  NoteButtonIcon,
  NoteContainer,
  NoteDate,
  NoteInfoContainer,
  NoteText,
  Photo,
  ReadMore,
  SlideContainer,
  SlideContent,
  SliderButton,
  SliderButtonIcon,
  SliderControls,
  SliderDot,
  SliderDots,
};
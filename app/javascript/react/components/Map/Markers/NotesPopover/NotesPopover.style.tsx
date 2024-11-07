import styled from "styled-components";
import {
  gray100,
  gray400,
  grey,
  white,
} from "../../../../assets/styles/colors";
import { media } from "../../../../utils/media";
import { H4 } from "../../../Typography";

const PopoverContainer = styled.div`
  position: relative;
`;

const NoteButton = styled.button`
  position: absolute;
  background-color: ${white};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NoteButtonIcon = styled.img`
  width: 20px;
  height: 20px;
`;

const NoteContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 40px;
  left: -100px;
  background: ${white};
  border-radius: 1rem;
  padding: 1.8rem 0.8rem;
  min-width: 240px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 4;
  width: 25rem;

  @media ${media.desktop} {
    width: 40rem;
    left: 0;
  }
`;

const SlideContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SlideContent = styled.div`
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  margin: 0 1.4rem;

  @media ${media.desktop} {
    flex-direction: row;
  }
`;

const DataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  padding: 0 8px;
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
  width: 16px;
  height: 16px;
  transform: ${(props) => (props.$left ? "rotate(180deg)" : "none")};
`;

const SliderDots = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  flex: 1;
`;

const SliderDot = styled.button<{ $active: boolean }>`
  width: 8px;
  height: 8px;
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

const NoteInfo = styled(H4)`
  margin-left: 0.8rem;
`;

export {
  DataContainer,
  NoteButton,
  NoteButtonIcon,
  NoteContainer,
  NoteInfo,
  NoteInfoContainer,
  Photo,
  PopoverContainer,
  ReadMore,
  SlideContainer,
  SlideContent,
  SliderButton,
  SliderButtonIcon,
  SliderControls,
  SliderDot,
  SliderDots,
};

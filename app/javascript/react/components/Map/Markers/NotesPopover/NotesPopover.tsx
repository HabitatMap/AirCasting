import moment from "moment";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import attachmentIcon from "../../../../assets/icons/attachmentIcon.svg";
import arrowRightIcon from "../../../../assets/icons/chevronRight.svg";
import closeIcon from "../../../../assets/icons/closeButton.svg";
import { DateFormat } from "../../../../types/dateFormat";
import { Note } from "../../../../types/note";
import { H4 } from "../../../Typography";
import * as S from "./NotesPopover.style";

interface NotesPopoverProps {
  notes: Note[];
}

const NotesPopover = ({ notes }: NotesPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useTranslation();

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : notes.length - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev < notes.length - 1 ? prev + 1 : 0));
  };

  return (
    <S.NoteWrapper>
      <S.NoteButton onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <S.NoteButtonIcon src={closeIcon} alt="Close popover" />
        ) : (
          <S.NoteButtonIcon src={attachmentIcon} alt="Open note" />
        )}
      </S.NoteButton>

      {isOpen && notes.length > 0 && (
        <S.NoteContainer $oneNote={notes.length === 1}>
          {notes.length > 1 && (
            <S.SliderControls>
              <S.SliderDots>
                {notes.map((_, index) => (
                  <S.SliderDot
                    key={index}
                    $active={index === currentSlide}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </S.SliderDots>
            </S.SliderControls>
          )}
          <S.SlideContainer>
            {notes.length > 1 && (
              <S.SliderButton onClick={handlePrevSlide}>
                <S.SliderButtonIcon src={arrowRightIcon} alt="Previous" $left />
              </S.SliderButton>
            )}
            <S.SlideContent>
              {notes[currentSlide].photo && (
                <a
                  href={`${process.env.BASE_URL}${notes[currentSlide].photo}`}
                  target="_blank"
                >
                  <S.Photo
                    src={`${process.env.BASE_URL}${notes[currentSlide].photoThumbnail}`}
                    alt="Note photo"
                  />
                </a>
              )}
              <S.DataContainer>
                <S.NoteInfoContainer>
                  <H4 $bold>{t("map.note.date")}</H4>
                  <S.NoteDate>
                    {moment
                      .utc(notes[currentSlide].date)
                      .format(DateFormat.us_with_time)}
                  </S.NoteDate>
                </S.NoteInfoContainer>
                <S.NoteInfoContainer>
                  <H4 $bold>{t("map.note.note")}</H4>
                  <S.NoteTextContainer>
                    <S.NoteText>{notes[currentSlide].text}</S.NoteText>
                  </S.NoteTextContainer>
                </S.NoteInfoContainer>
              </S.DataContainer>
            </S.SlideContent>
            {notes.length > 1 && (
              <S.SliderButton onClick={handleNextSlide}>
                <S.SliderButtonIcon src={arrowRightIcon} alt="Next" />
              </S.SliderButton>
            )}
          </S.SlideContainer>
        </S.NoteContainer>
      )}
    </S.NoteWrapper>
  );
};

export { NotesPopover };

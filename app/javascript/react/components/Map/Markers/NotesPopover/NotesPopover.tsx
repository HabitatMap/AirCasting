import moment from "moment";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import attachmentIcon from "../../../../assets/icons/attachmentIcon.svg";
import arrowRightIcon from "../../../../assets/icons/chevronRight.svg";
import { DateFormat } from "../../../../types/dateFormat";
import { Note } from "../../../../types/note";
import { H4 } from "../../../Typography";
import * as S from "./NotesPopover.style";

interface NotesPopoverProps {
  notes: Note[];
}

const NotesPopover = ({ notes }: NotesPopoverProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useTranslation();
  const isOneNote = notes.length === 1;
  const isMultipleNotes = notes.length > 1;
  const NOTE_CHARACTER_LIMIT = 60;

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : notes.length - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev < notes.length - 1 ? prev + 1 : 0));
  };

  return (
    <S.NoteWrapper>
      <S.NotesPopup
        trigger={
          <S.NoteButton>
            <S.NoteButtonIcon
              src={attachmentIcon}
              alt={t("map.note.altOpenNote")}
            />
          </S.NoteButton>
        }
        position="top center"
        repositionOnResize={true}
        keepTooltipInside={true}
        arrow={false}
        closeOnDocumentClick
        offsetX={10}
        offsetY={10}
      >
        {notes.length > 0 && (
          <S.NoteContainer $oneNote={isOneNote}>
            {isMultipleNotes && (
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
              {isMultipleNotes && (
                <S.SliderButton onClick={handlePrevSlide}>
                  <S.SliderButtonIcon
                    src={arrowRightIcon}
                    alt={t("map.note.altPrevious")}
                    $left
                  />
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
                      alt={t("map.note.altPhoto")}
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
                    <S.NoteTextContainer
                      $isScrollable={
                        notes[currentSlide].text.length > NOTE_CHARACTER_LIMIT
                      }
                    >
                      <S.NoteText>{notes[currentSlide].text}</S.NoteText>
                    </S.NoteTextContainer>
                  </S.NoteInfoContainer>
                </S.DataContainer>
              </S.SlideContent>
              {isMultipleNotes && (
                <S.SliderButton onClick={handleNextSlide}>
                  <S.SliderButtonIcon
                    src={arrowRightIcon}
                    alt={t("map.note.altNext")}
                  />
                </S.SliderButton>
              )}
            </S.SlideContainer>
          </S.NoteContainer>
        )}
      </S.NotesPopup>
    </S.NoteWrapper>
  );
};

export { NotesPopover };

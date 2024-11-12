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
            <S.NoteButtonIcon src={attachmentIcon} alt="Open note" />
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
                  <S.SliderButtonIcon
                    src={arrowRightIcon}
                    alt="Previous"
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
                      <S.NoteText>
                        It is a long established fact that a reader will be
                        distracted by the readable content of a page when
                        looking at its layout. The point of using Lorem Ipsum is
                        that it has a more-or-less normal distribution of
                        letters, as opposed to using 'Content here, content
                        here', making it look like readable English. Many
                        desktop publishing packages and web page editors now use
                        Lorem Ipsum as their default model text, and a search
                        for 'lorem ipsum' will uncover many web sites still in
                        their infancy. Various versions have evolved over the
                        years, sometimes by accident, sometimes on purpose
                        (injected humour and the like).
                        {/* {notes[currentSlide].text} */}
                      </S.NoteText>
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
      </S.NotesPopup>
    </S.NoteWrapper>
  );
};

export { NotesPopover };

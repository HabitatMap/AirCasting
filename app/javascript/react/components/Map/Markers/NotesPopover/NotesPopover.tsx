import moment from "moment";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import attachmentIcon from "../../../../assets/icons/attachmentIcon.svg";
import { DateFormat } from "../../../../types/dateFormat";
import { Note } from "../../../../types/note";
import * as S from "./NotesPopover.style";

interface NotesPopoverProps {
  notes: Note[];
  onClose: () => void;
}

const NotesPopover = ({ notes, onClose }: NotesPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <S.PopoverContainer>
      <S.NoteButton onClick={() => setIsOpen(!isOpen)}>
        <S.NoteButtonIcon src={attachmentIcon} alt="Note" />
      </S.NoteButton>

      {isOpen && (
        <S.NoteContainer>
          <S.ClosePopoverButton
            onClick={() => {
              setIsOpen(false);
              onClose();
            }}
          />
          {notes.map((note) => {
            const dateStr = moment
              .utc(note.date)
              .format(DateFormat.us_with_time);
            return (
              <div key={note.id}>
                <S.DataContainer>
                  <S.NoteInfoContainer>
                    <S.NoteInfoBoldText>
                      {t("map.note.date")}
                    </S.NoteInfoBoldText>
                    <S.NoteInfoText>{dateStr}</S.NoteInfoText>
                  </S.NoteInfoContainer>
                  <S.NoteInfoContainer>
                    <S.NoteInfoBoldText>
                      {t("map.note.note")}
                    </S.NoteInfoBoldText>
                    <S.NoteInfoText>{note.text}</S.NoteInfoText>
                  </S.NoteInfoContainer>
                </S.DataContainer>
                {note.photo && (
                  <S.PhotoContainer>
                    <a
                      href={`${process.env.BASE_URL}${note.photo}`}
                      target="_blank"
                    >
                      <S.Photo
                        src={`${process.env.BASE_URL}${note.photoThumbnail}`}
                        alt="Note photo"
                      />
                    </a>
                  </S.PhotoContainer>
                )}
              </div>
            );
          })}
        </S.NoteContainer>
      )}
    </S.PopoverContainer>
  );
};

export { NotesPopover };

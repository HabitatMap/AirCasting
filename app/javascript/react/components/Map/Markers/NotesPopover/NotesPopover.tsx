import React from "react";
import { useTranslation } from "react-i18next";

import moment from "moment";
import { DateFormat } from "../../../../types/dateFormat";
import { Note } from "../../../../types/note";
import * as S from "./NotesPopover.style";

interface NotesPopoverProps {
  note: Note;
  onClose: () => void;
  position: { bottom: string; left: string };
}

const NotesPopover = ({ note, onClose, position }: NotesPopoverProps) => {
  const { t } = useTranslation();
  const dateStr = moment.utc(note.date).format(DateFormat.us_with_time);

  return (
    <S.NoteContainer $bottom={position.bottom} $left={position.left}>
      <S.DataContainer>
        <S.ClosePopoverButton onClick={onClose} />
        <S.NoteInfoContainer>
          <S.NoteInfoBoldText>{t("map.note.date")}</S.NoteInfoBoldText>
          <S.NoteInfoText>{dateStr}</S.NoteInfoText>
        </S.NoteInfoContainer>
        <S.NoteInfoContainer>
          <S.NoteInfoBoldText>{t("map.note.note")}</S.NoteInfoBoldText>
          <S.NoteInfoText>{note.text}</S.NoteInfoText>
        </S.NoteInfoContainer>
        <S.PhotoContainer>
          <a href={`${process.env.BASE_URL}${note.photo}`} target="_blank">
            <S.Photo
              src={`${process.env.BASE_URL}${note.photoThumbnail}`}
              alt="Note photo"
            />
          </a>
        </S.PhotoContainer>
      </S.DataContainer>
    </S.NoteContainer>
  );
};

export { NotesPopover };

import React from "react";
import { useTranslation } from "react-i18next";

import moment from "moment";
import { DateFormat } from "../../../../types/dateFormat";
import { Note } from "../../../../types/note";
import * as S from "./NotesPopover.style";

interface NotesPopoverProps {
  note: Note;
  onClose: () => void;
}

const NotesPopover = ({ note, onClose }: NotesPopoverProps) => {
  const { t } = useTranslation();
  const dateStr = moment.utc(note.date).format(DateFormat.us_with_time);

  return (
    <S.NoteContainer>
      <S.ClosePopoverButton onClick={onClose} />
      <S.DataContainer>
        <S.NoteInfoContainer>
          <S.NoteInfoBoldText>{t("map.note.date")}</S.NoteInfoBoldText>
          <S.NoteInfoText>{dateStr}</S.NoteInfoText>
        </S.NoteInfoContainer>
        <S.NoteInfoContainer>
          <S.NoteInfoBoldText>{t("map.note.note")}</S.NoteInfoBoldText>
          <S.NoteInfoText>{note.text}</S.NoteInfoText>
        </S.NoteInfoContainer>
      </S.DataContainer>
      <S.PhotoContainer>
        <a href={`${process.env.BASE_URL}${note.photo}`} target="_blank">
          <S.Photo
            src={`${process.env.BASE_URL}${note.photoThumbnail}`}
            alt="Note photo"
          />
        </a>
      </S.PhotoContainer>
    </S.NoteContainer>
  );
};

export { NotesPopover };

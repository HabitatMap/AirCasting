import { Note } from "../types/note";

const roundCoordinate = (coord: number): number => {
  return Math.round(coord * 1000000) / 1000000;
};

export const getNotesAtSamePosition = (
  allNotes: Note[],
  targetNote: Note
): Note[] => {
  const targetLat = roundCoordinate(targetNote.latitude);
  const targetLng = roundCoordinate(targetNote.longitude);

  return allNotes.filter(
    (note) =>
      roundCoordinate(note.latitude) === targetLat &&
      roundCoordinate(note.longitude) === targetLng
  );
};

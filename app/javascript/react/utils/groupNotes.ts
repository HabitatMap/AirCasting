import { Note } from "../types/note";

const COORDINATE_PRECISION = 1000000;

const roundCoordinate = (coord: number): number => {
  return Math.round(coord * COORDINATE_PRECISION) / COORDINATE_PRECISION;
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

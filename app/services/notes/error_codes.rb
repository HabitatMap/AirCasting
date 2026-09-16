module Notes
  # Adds the one code the note endpoints need on top of the mobile-session
  # vocabulary they otherwise share. `note_not_found` is distinct from
  # `session_not_found` on purpose: a client that sent a stale note id should
  # drop that note, whereas one that sent a stale session uuid should drop the
  # whole session.
  module ErrorCodes
    NOTE_NOT_FOUND = 'note_not_found'
  end
end

class Csv::NotesData
  attr_reader :notes, :session_id

  def initialize(data)
    @session_id = data.fetch("session_id")
    @notes = data.fetch("notes")
  end
end

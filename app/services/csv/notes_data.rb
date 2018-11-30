class Csv::NotesData
  attr_reader :notes

  def initialize(data)
    @notes = data.fetch("notes")
  end
end

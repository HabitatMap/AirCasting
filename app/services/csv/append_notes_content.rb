class Csv::AppendNotesContent
  def call(csv, data)
    append_headings(csv)
    append_notes(csv, data)
  end

  private

  def append_headings(csv)
    csv << %w(Note Time Latitude Longitude)
  end

  def append_notes(csv, data)
    data.notes.each do |note|
      append_note(csv, note)
    end
    
    csv
  end

  def append_note(csv, note)
    csv << [note[:text], format_time(note[:date]), note[:latitude], note[:longitude]]
  end

  def format_time(date)
    date.strftime("%FT%T")
  end
end

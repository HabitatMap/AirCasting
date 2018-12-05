class Csv::AppendNotesContent
  def call(csv, data)
    append_headings(csv)
    append_notes(csv, data)
  end

  private

  def append_headings(csv)
    csv << %w(Note Time Latitude Longitude Photo_Url)
  end

  def append_notes(csv, data)
    data.notes.each do |note|
      append_note(csv, note)
    end
  end

  def append_note(csv, note)
    csv << [note["text"], format_time(note["date"]), note["latitude"], note["longitude"], format_url(note)]
  end

  def format_time(date)
    date.strftime("%FT%T")
  end

  def format_url(note)
    if note["photo_file_name"]
      current_host_url.to_s + "system/" + note["photo_file_name"]
    else
      "No photo"
    end
  end

  def current_host_url
    "http://aircasting.org/"
    # would be better to use request.base_url but it only works in controllers
  end
end

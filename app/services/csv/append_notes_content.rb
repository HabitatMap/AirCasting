module Csv
  class AppendNotesContent
    def initialize(host: A9n.host)
      @host = host
    end

    def call(csv, notes)
      append_headings(csv)
      append_notes(csv, notes)
    end

    private

    attr_reader :host

    def append_headings(csv)
      csv << %w[Note Time Latitude Longitude Photo_Url]
    end

    def append_notes(csv, notes)
      notes.each { |note| append_note(csv, note) }
    end

    def append_note(csv, note)
      csv << [
        note.text,
        format_time(note.date),
        note.latitude,
        note.longitude,
        format_url(note),
      ]
    end

    def format_time(date)
      date.strftime('%FT%T')
    end

    def format_url(note)
      if note.s3_photo.attached?
        Rails.application.routes.url_helpers.rails_blob_url(
          note.s3_photo,
          host: host,
        )
      else
        'No photo was attached'
      end
    end
  end
end

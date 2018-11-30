require "spec_helper"

describe Csv::AppendNotesContent do
  let(:csv) { [] }
  let(:date) { DateTime.new(2018,8,20,11,16,44) }
  let(:latitude) { BigDecimal.new("40.68038924") }
  let(:longitude) { BigDecimal.new("-73.97631499") }
  let(:note1) { { text: "Example Note", date: date, latitude: latitude, longitude: longitude, } }
  let(:note_with_comma) { { text: 'Example, Note', date: date, latitude: latitude, longitude: longitude, } }
  let(:note2) { { text: "Example Note 2", date: date, latitude: latitude, longitude: longitude, } }
  let(:expected_headers) { %w(Note Time Latitude Longitude) }

  it "appends correct headers" do
    actual_headers = subject.call(csv, build_data([note1])).first

    expect(actual_headers).to eq(expected_headers)
  end

  it "appends the content of the note" do
    actual_note = subject.call(csv, build_data([note1])).second

    expected_note = ["Example Note","2018-08-20T11:16:44",latitude,longitude]

    expect(actual_note).to eq(expected_note)
  end

  it "can handel notes with commas" do
    actual_note = subject.call(csv, build_data([note_with_comma])).second

    expected_note = ["Example, Note","2018-08-20T11:16:44",latitude,longitude]

    expect(actual_note).to eq(expected_note)
  end

  it "appends correct content" do
    actual_content = subject.call(csv, build_data([note1, note2]))

    expected_content = [
      expected_headers,
      ["Example Note","2018-08-20T11:16:44",latitude,longitude],
      ["Example Note 2","2018-08-20T11:16:44",latitude,longitude],
    ]

    expect(actual_content).to eq(expected_content)
  end

  private

  def build_data(notes)
    Csv::NotesData.new(
      "notes" => notes
    )
  end
end

require "spec_helper"

describe Csv::AppendNotesContent do
  let(:lines) { [] }
  let(:date) { DateTime.new(2018,8,20,11,16,44) }
  let(:latitude) { BigDecimal.new("40.68038924") }
  let(:longitude) { BigDecimal.new("-73.97631499") }
  let(:photo_url) { /http:\/\/localhost:3000\/system\/.+jpg\?\d+$/ }

  it "appends correct headers" do
    note = create_note!
    subject.call(lines, [note])

    actual_headers = lines.first

    expected_headers = %w(Note Time Latitude Longitude Photo_Url)
    expect(actual_headers).to eq(expected_headers)
  end

  it "appends note and image info" do
    note = create_note!
    subject.call(lines, [note])

    actual_note = lines.second

    expected_note = ["Example Note","2018-08-20T11:16:44",latitude,longitude,photo_url]
    expect(actual_note[0..-2]).to eq(expected_note[0..-2])
    expect(actual_note[-1]).to match(expected_note[-1])
  end

  private

  def create_note!
    Note.create!(
      session: Session.new,
      text: "Example Note",
      date: date,
      latitude: latitude,
      longitude: longitude,
      photo: File.new("#{Rails.root}/spec/support/example_photo.jpg"),
    )
  end
end

require 'spec_helper'

describe Csv::ExportSessionsToCsv do
  before(:each) { @subject = Csv::ExportSessionsToCsv.new }

  after(:each) { @subject.clean }

  it 'with no sessions the zip just contains an empty dotfile' do
    session_ids = []

    zip_path = @subject.call(session_ids)

    Zip::File.open(zip_path) { |zip_file| expect(zip_file.size).to eq(1) }
  end

  it 'with one session with one stream and with one measurement the zip contains one empty dotfile and one file with the right CSV content and filename' do
    session = create_session!(title: 'Example Session')
    stream =
      create_stream!(
        sensor_package_name: 'AirBeam2:00189610719F',
        sensor_name: 'AirBeam2-F',
        measurement_type: 'Temperature',
        unit_name: 'Fahrenheit',
        session: session
      )
    measurement =
      create_measurement!(
        time: DateTime.new(2_018, 8, 20, 11, 16, 44),
        latitude: BigDecimal('40.68038924'),
        longitude: BigDecimal('-73.97631499'),
        value: 77.0,
        milliseconds: 234,
        stream: stream
      )

    zip_path = @subject.call([session.id])

    Zip::File.open(zip_path) do |zip_file|
      actual_contents = file_content(zip_file)
      actual_filenames = file_names(zip_file)

      expected_filename = /example_session_#{session.id}__.*\.csv$/
      expect(actual_filenames).to match(expected_filename)

      expected_contents = [
        '',
        File.read("#{Rails.root}/spec/support/session_stream_measurement.csv")
      ]
      expect(actual_contents).to eq(expected_contents)
    end
  end

  it 'adds a file with session notes and images info' do
    session = create_session!
    note =
      Note.create!(
        text: 'Example Note',
        date: DateTime.new(2_018, 8, 20, 11, 16, 44),
        latitude: BigDecimal('40.68038924'),
        longitude: BigDecimal('-73.97631499'),
        photo: File.new("#{Rails.root}/spec/fixtures/test.jpg"),
        session: session
      )

    zip_path = @subject.call([session.id])

    Zip::File.open(zip_path) do |zip_file|
      actual_contents = file_content(zip_file).last
      actual_filenames = file_names(zip_file)

      expected_filename = /notes_from_example_session_#{session.id}__.*\.csv$/
      expect(actual_filenames).to match(expected_filename)

      expected_contents = %r{^Note,Time,Latitude,Longitude,Photo_Url\nExample Note,2018-08-20T11:16:44,40.68038924,-73.97631499,http:\/\/localhost:3000\/\/system\/.+jpg\?\d+\n$}
      expect(actual_contents).to match(expected_contents)
    end
  end

  private

  def file_content(zip_file)
    zip_file.entries.map { |entry| entry.get_input_stream.read }
  end

  def file_names(zip_file)
    zip_file.entries.map(&:name).join(', ')
  end
end
